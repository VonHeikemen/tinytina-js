const arg = require('@zeit/arg');

const { bind, get_or, is_nil, map, reduce } = require('../common/utils');

function parse_query(request_prop, value) {
  let [collection_path = '', requests = ''] = value.split(':');

  return {
    collection: collection_path.split('.'),
    requests: requests ? requests.split(',') : [],
    request_prop
  };
}

function param_to_env(state, value) {
  let item = value.split(':');

  if (item.length === 2) {
    state[item[0]] = item[1];
  } else if (item.length > 2) {
    state[item[0]] = item.slice(1).join(':');
  }

  return state;
}

function process_args(process_argv) {
  try {
    var args = arg(process_argv, {
      '--arg-separator': String,
      '--env': String,
      '--example-syntax': String,
      '--exclude': String,
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
    });
  } catch (err) {
    return { err };
  }

  if (Boolean(args['--help'])) {
    return { command: { name: 'help' } };
  }

  if (Boolean(args['--version'])) {
    return { command: { name: 'version' } };
  }

  let argv = get_or([], '_', args);
  let opts = { command: {} };

  opts.command.name = get_or('', [0], argv);

  switch (opts.command.name) {
    case 'run': {
      const parse = bind(parse_query, get_or('id', '--request-prop', args));
      opts.hide_vars = get_or([], '--hide', args);
      opts.command.args = map(parse, argv.slice(1));
      opts.command.config = {
        raw_output: Boolean(args['--raw-response'])
      };

      if (args['--interactive']) {
        opts.command.name += '-interactive';
      }

      break;
    }
    case 'run-all': {
      opts.command.config = {
        raw_output: Boolean(args['--raw-response'])
      };
      break;
    }
    case 'list': {
      opts.command.args = argv.slice(1);
      break;
    }
    case 'convert-to': {
      const parse = bind(parse_query, get_or('id', '--request-prop', args));
      opts.command.args = map(parse, argv.slice(2));
      opts.command.config = {
        arg_separator: get_or(' ', '--arg-separator', args),
        syntax: argv[1]
      };
      break;
    }
    case 'markdown':
    case 'md': {
      const parse = bind(
        map,
        bind(parse_query, get_or('id', '--request-prop', args))
      );
      opts.command.name = 'markdown';
      opts.command.config = {
        arg_separator: get_or('\n', '--arg-separator', args),
        exclude: parse(get_or('', '--exclude', args).split(' ')),
        syntax: get_or('curl', '--example-syntax', args)
      };
      break;
    }
    case 'test-script': {
      const parse = bind(parse_query, get_or('id', '--request-prop', args));
      opts.command.args = argv.slice(2);
      opts.command.config = {
        path: argv[1],
        parse_query: parse
      };
      break;
    }
    default:
      const message = opts.command.name.length
        ? `${opts.command.name} is not a valid command`
        : 'Must provide a command';

      return {
        err: {
          message,
          info: 'use the --help command to learn about the available commands'
        }
      };
  }

  if (is_nil(args['--schema'])) {
    return {
      err: { message: 'must provide --schema with a path to a json file' }
    };
  }

  opts.schema_path = args['--schema'];
  opts.schema_type = get_or('tinytina', '--schema-type', args);
  opts.env_name = get_or('', '--env', args);
  opts.env_vars = reduce(param_to_env, {}, args['--global']);

  return opts;
}

module.exports = {
  parse_query,
  param_to_env,
  process_args
};
