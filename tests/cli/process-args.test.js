const t = require('assert').strict;

const { parse_query, process_args } = require('../../src/cli/utils');
const { fake_args, cli_input } = require('./helpers');

suite('# cli - process arguments');

test('parse collection query to object', function() {
  const expected = {
    collection: ['short-id', 'oh-look'],
    requests: ['guess-filename', 'other'],
    request_prop: 'id'
  };

  const query = parse_query('id', 'short-id.oh-look:guess-filename,other');

  t.deepEqual(
    query,
    expected,
    'parsed a nested collection path with multiple requests'
  );
});

test('gather arguments for "run" command', function() {
  const expected = fake_args('run');

  const result = process_args(cli_input(['run', 'auth:login']));

  t.deepEqual(result, expected, 'arguments object has the right shape');
});

test('gather arguments for "run" in interactive mode', function() {
  const expected = fake_args('run-interactive');

  const result = process_args(
    cli_input(['run', 'auth:login', '--interactive'])
  );

  t.deepEqual(result, expected, 'arguments object has the right shape');
});

test('gather arguments for "run-all" command', function() {
  const expected = fake_args('run-all');
  delete expected.command.args;
  delete expected.hide_vars;

  const result = process_args(cli_input(['run-all', 'auth:login']));

  t.deepEqual(result, expected, 'arguments object has the right shape');
});

test('gather arguments for "help" command', function() {
  const expected = { command: { name: 'help' } };

  const result = process_args(
    cli_input(['run', 'auth:login', '--version', '--help'])
  );

  t.deepEqual(result, expected, 'arguments object has the right shape');
});

test('gather arguments for "help" command', function() {
  const expected = { command: { name: 'version' } };

  const result = process_args(cli_input(['run', 'auth:login', '--version']));

  t.deepEqual(result, expected, 'arguments object has the right shape');
});

test('return error when --schema is missing', function() {
  const expected = {
    err: { message: 'must provide --schema with a path to a json file' }
  };

  const result = process_args(['run', 'auth:login']);

  t.deepEqual(result, expected, 'must be an error object');
});

test('return error when unknown argument is given', function() {
  const expected = 'Unknown or unexpected option: --dont';
  const result = process_args(['--dont', 'dev', 'run', 'auth:login']);

  t.equal(result.err.message, expected, '');
});

test('return error when command name is invalid', function() {
  const expected = 'Must provide a valid command';
  const result_mispelled = process_args(['runner', 'auth:login']);

  t.equal(result_mispelled.err.message, expected, '');

  const result_empty = process_args([]);
  t.equal(result_empty.err.message, expected, '');
});
