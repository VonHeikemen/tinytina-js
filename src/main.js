const arg = require('@zeit/arg');
const jsonfile = require('jsonfile');
const color_support = require('color-support').hasBasic;
const c = require('ansi-colors');

const { run, help, version } = require('./cli/index.js');
const { parse_query, param_to_env } = require('./cli/utils');
const { create_reader } = require('./common/reader');
const { is_nil, is_empty, map, reduce } = require('./common/utils');

c.enabled = color_support;
var debug = false;

const args = process_args(() =>
  arg({
    '--env': String,
    '--global': [String],
    '--hide': [String],
    '--interactive': Boolean,
    '--raw-response': Boolean,
    '--request-prop': String,
    '--schema': String,
    '--debug': Boolean,
    '--help': Boolean,
    '--version': Boolean,
    // '--schema-type': String,

    '-e': '--env',
    '-g': '--global',
    '-h': '--help',
    '-hi': '--hide',
    '-i': '--interactive',
    '-r': '--raw-response',
    '-p': '--request-prop',
    '-s': '--schema',
    '-v': '--version'
    // '-t': '--schema-type',
  })
);

function process_args(get_args) {
  try {
    var args = get_args();
  } catch (err) {
    debug = process.argv.includes('--debug');
    return { err };
  }

  debug = Boolean(args['--debug']);

  if (Boolean(args['--help'])) {
    return { command: { name: 'help' } };
  }

  if (Boolean(args['--version'])) {
    return { command: { name: 'version' } };
  }

  let opts = { command: {} };

  opts.command.name = (args['_'] || [])[0];
  opts.command.config = {
    raw_output: Boolean(args['--raw-response']),
    interactive_mode: args['--interactive'] || false
  };

  switch (opts.command.name) {
    case 'run':
      let arg_list = (args['_'] || []).slice(1);
      let request_prop = args['--request-prop'] || 'id';
      const parse = val => parse_query(request_prop, val);

      opts.command.args = map(parse, arg_list);
      break;
    case 'run-all':
      break;
    default:
      let msg =
        'Must provide a valid command\n\n' +
        c.blue('Info: ') +
        'use the --help command to learn about the available commands';

      return { err: msg };
  }

  if (is_nil(args['--schema'])) {
    return { err: 'must provide --schema with a path to a json file' };
  }

  opts.schema_path = args['--schema'];
  opts.schema_type = args['--schema-type'] || 'tinytina';
  opts.hide_vars = args['--hide'] || [];
  opts.env_name = args['--env'] || '';
  opts.env_vars = reduce(param_to_env, {}, args['--global']);

  return opts;
}

async function main({
  command,
  env_name,
  env_vars,
  hide_vars,
  schema_path,
  schema_type,
  err = false
}) {
  if (err) {
    return Promise.reject(err);
  }

  if (command.name === 'help') {
    return console.log(help());
  }

  if (command.name === 'version') {
    return console.log(version());
  }

  try {
    var schema = await jsonfile.readFile(schema_path);
  } catch (err) {
    return Promise.reject(err.message);
  }

  let reader = create_reader(schema_type);

  let [state, error] = reader.create_state(schema, env_name, {
    extra_vars: env_vars,
    hide_vars
  });

  if (error) {
    return Promise.reject(error);
  }

  if (command.name === 'run') {
    return run.collection(reader, state, command);
  }

  if (command.name === 'run-all') {
    return run.all(reader, state, command.config);
  }
}

main(args).catch(e => console.error(pretty_err(e)));

function pretty_err(error) {
  if (debug) {
    return error;
  }

  let title = c.bold.white('Whoops, something went wrong');
  let msg = `\n${title}\n\n`;

  if (is_empty(error)) {
    msg +=
      'Something weird and unexpected happened while processing the request.';
    return msg;
  }

  msg += `${c.bold.red('Error:')} `;
  if (typeof error == 'string') {
    msg += error;
    return msg;
  }

  if (!is_nil(error.message)) {
    msg += error.message;
    return msg;
  }

  return msg;
}
