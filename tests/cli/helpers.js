const { parse_query } = require('../../src/cli/utils');
const { bind, map } = require('../../src/common/utils');
const tinytina = require('../../src/schemas/tinytina.js');
const example_schema = require('../schemas/fixtures/tinytina-schema.json');

const fake_args = (name = '') => ({
  command: {
    name,
    config: {
      raw_output: false
    },
    args: [parse_query('id', 'auth:login')]
  },
  schema_path: './example.json',
  schema_type: 'tinytina',
  hide_vars: ['password', 'api'],
  env_name: 'dev',
  env_vars: {
    token: '123',
    api: 'secret'
  }
});

const cli_input = args =>
  [
    '--schema',
    './example.json',
    '--env',
    'dev',
    '--global',
    'token:123',
    '--global',
    'api:secret',
    '--hide',
    'password',
    '--hide',
    'api'
  ].concat(args);

function command_context() {
  const parse = bind(parse_query, 'id');
  const context = {
    reader: tinytina,
    schema: example_schema
  };

  context.create_state = () =>
    context.reader
      .create_state(example_schema, 'development', { hide_vars: ['host'] })
      .unwrap_or(false);

  context.create_command = (name, ...args) => ({
    name,
    config: {
      raw_output: false
    },
    args: map(parse, args)
  });

  return context;
}

module.exports = {
  fake_args,
  cli_input,
  command_context
};
