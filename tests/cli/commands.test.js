const t = require('assert').strict;

const { Form } = require('enquirer');

const { is_empty, bind } = require('../../src/common/utils');
const { parse_query } = require('../../src/cli/utils');
const { run } = require('../../src/cli/commands');
const version = require('../../src/cli/version');
const { command_context } = require('./helpers');

const { reader, create_state, create_command } = command_context();

const identity = arg => arg;
const constant = arg => () => arg;
const stub = constant(identity);

const prompt = options => {
  options.show = false;
  const form = new Form(options);
  form.once('run', async () => {
    await form.submit();
  });

  return form.run();
};

const next_action = (message, fn, req) => {
  return req;
};

suite('# cli - run command');

test('get one request from one collection', async function() {
  const command = create_command('run', 'short-id:also-short');
  const effect = run
    .collection(reader, create_state(), command)
    .cata(identity, constant);

  const collections = await effect({ http: stub });

  t.ok(Array.isArray(collections), 'collections is an array');
  t.deepEqual(collections.length, 1, 'collections has one element');

  const [requests] = collections;

  t.deepEqual(requests.length, 1, 'requests has one element');
  t.equal(requests[0].id, 'also-short', '');
});

test('get multiple requests from one collection', async function() {
  const command = create_command(
    'run',
    'short-id.oh-look:guess-filename,download-face'
  );
  const effect = run
    .collection(reader, create_state(), command)
    .cata(identity, constant);

  const collections = await effect({ http: stub });

  t.ok(Array.isArray(collections), 'collections is an array');
  t.deepEqual(collections.length, 1, 'collections has one element');

  const [requests] = collections;

  t.equal(requests.length, 2, 'retrieved all requests');
  t.equal(requests[0].id, 'download-face', '');
  t.equal(requests[1].id, 'guess-filename', '');
});

test('get all requests from one collection', async function() {
  const command = create_command('run', 'another');
  const effect = run
    .collection(reader, create_state(), command)
    .cata(identity, constant);

  const collections = await effect({ http: stub });

  t.ok(Array.isArray(collections), 'collections is an array');
  t.deepEqual(collections.length, 1, 'collections has one element');

  const [requests] = collections;

  t.equal(requests.length, 3, 'retrieved all requests');
});

test('get requests from multiple collections', async function() {
  const command = create_command(
    'run',
    'short-id:also-short',
    'another:has-id'
  );
  const effect = run
    .collection(reader, create_state(), command)
    .cata(identity, constant);

  const collections = await effect({ http: stub });

  t.ok(Array.isArray(collections), 'collections is an array');
  t.equal(collections.length, 2, 'collections has all elements');

  const [col_1, col_2] = collections;

  t.equal(col_1[0].id, 'also-short', '');
  t.equal(col_2[0].id, 'has-id', '');
});

test('report collection not found', function() {
  const command = create_command('run', 'wrong-id:also-wrong');
  const effect = run
    .collection(reader, create_state(), command)
    .cata(identity, constant);

  const report = effect({ http: stub });

  t.equal(typeof report, 'string', '');

  const lines = report.split('\n');
  t.equal(lines[1], 'could not find collection wrong-id', '');
});

test('report request not found', function() {
  const command = create_command('run', 'short-id:also-wrong');
  const effect = run
    .collection(reader, create_state(), command)
    .cata(identity, constant);

  const report = effect({ http: stub });

  t.equal(typeof report, 'string', '');

  const lines = report.split('\n');
  t.equal(lines[1], 'could not find request id also-wrong in short-id', '');
});

test('capture request error', async function() {
  const command = create_command('run', 'short-id:also-short');
  const effect = run
    .collection(reader, create_state(), command)
    .cata(identity, constant);

  const expected_error = 'a random error';
  const stub = () => () => Promise.reject(expected_error);

  const report = await effect({ http: stub }).catch(identity);
  t.equal(typeof report, 'string', '');

  t.equal(report, expected_error, '');
});

suite('# cli - run command interactive mode');

test('process one request', async function() {
  const path = 'short-id:also-short';
  const expected_request = reader
    .get_requests(create_state().collection, parse_query('id', path))
    .chain(res => res[0]);

  const command = create_command('run-interactive', path);
  const effect = run
    .interactive(reader, create_state(), command)
    .map(eff => bind(eff, prompt, next_action))
    .cata(identity, constant);

  const request = await effect({ http: stub });

  t.equal(request.url, expected_request.url, '');
});

test("don't allow multiple requests", function() {
  const command = create_command(
    'run-interactive',
    'short-id:also-short',
    'other:path'
  );
  const effect = run
    .interactive(reader, create_state(), command)
    .map(eff => bind(eff, prompt, next_action))
    .cata(identity, constant);

  const report = effect({ http: stub });

  t.equal(typeof report, 'string', '');
  t.equal(report, "Can't process multiple requests in interactive mode", '');
});

test("don't allow request.data object", async function() {
  const command = create_command(
    'run-interactive',
    'short-id:json-data'
  );
  const effect = run
    .interactive(reader, create_state(), command)
    .map(eff => bind(eff, prompt, next_action))
    .cata(identity, constant);

  const report = await effect({ http: stub }).catch(identity);

  t.equal(typeof report, 'string', '');
  t.equal(report, "Can't render form. 'data' needs to be an array", '');
});

test('report collection not found', function() {
  const command = create_command('run', 'wrong-id:also-wrong');
  const effect = run
    .interactive(reader, create_state(), command)
    .map(eff => bind(eff, prompt, next_action))
    .cata(identity, constant);

  const report = effect({ http: stub });

  t.equal(typeof report, 'string', '');

  t.equal(report, 'could not find collection wrong-id', '');
});

test('report request not found', function() {
  const command = create_command('run', 'short-id:also-wrong');
  const effect = run
    .interactive(reader, create_state(), command)
    .map(eff => bind(eff, prompt, next_action))
    .cata(identity, constant);

  const report = effect({ http: stub });

  t.equal(typeof report, 'string', '');
  t.equal(report, 'could not find request id also-wrong in short-id', '');
});

suite('# cli - run-all command');

test('runs all requests in the schema', function() {
  const command = create_command('run-all', 'short-id:also-short');
  const effect = run
    .all(reader, create_state(), command.config)
    .cata(identity, constant);

  const requests = effect({ http: stub });

  t.equal(requests.length, 7, 'got all requests');
});

suite('# cli - version command');

test('version is in sync with package.json', function() {
  const pkg_version = process.env.npm_package_version || false;

  t.ok(pkg_version, 'pkg_version is empty');
  t.equal(version(), 'v' + pkg_version, '');
});
