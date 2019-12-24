const arg = require('@zeit/arg');
const jsonfile = require('jsonfile');
const color_support = require('color-support').hasBasic;
const c = require('ansi-colors');

const { run, help, version } = require('./cli/index.js');
const { parse_query, param_to_env } = require('./cli/utils');
const { create_reader } = require('./common/reader');
const {
  bind,
  get_or,
  is_nil,
  is_empty,
  map,
  reduce,
  reject
} = require('./common/utils');
const Result = require('./common/Result');

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

  let argv = get_or([], '_', args);
  let opts = { command: {} };

  opts.command.name = get_or('', [0], argv);
  opts.command.config = {
    raw_output: Boolean(args['--raw-response']),
    interactive_mode: get_or(false, '--interactive', args)
  };

  switch (opts.command.name) {
    case 'run':
      const parse = bind(parse_query, get_or('id', '--request-prop', args));

      opts.command.args = map(parse, argv.slice(1));
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
  opts.schema_type = get_or('tinytina', '--schema-type', args);
  opts.hide_vars = get_or([], '--hide', args);
  opts.env_name = get_or('', '--env', args);
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

  let state = reader.create_state(schema, env_name, {
    extra_vars: env_vars,
    hide_vars
  });

  if (state.is_err) {
    return state.altchain(reject);
  }

  if (command.name === 'run') {
    return run.collection(reader, state.unwrap_or({}), command);
  }

  if (command.name === 'run-all') {
    return run.all(reader, state.unwrap_or({}), command.config);
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
