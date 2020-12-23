const t = require('assert').strict;

const { Form } = require('enquirer');

const { is_empty, bind } = require('../../src/common/utils');
const { parse_query } = require('../../src/cli/utils');
const { run, list, convert_to, doc } = require('../../src/cli/commands');
const version = require('../../src/cli/version');
const { command_context } = require('./helpers');

const expected = require('../schemas/fixtures/expected-data');

const { reader, create_state, create_command } = command_context();

const identity = (arg) => arg;
const constant = (arg) => () => arg;
const stub = constant(identity);

const prompt = (options) => {
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

test('get one request from one collection', async function () {
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

test('get multiple requests from one collection', async function () {
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

test('get all requests from one collection', async function () {
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

test('get requests from multiple collections', async function () {
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

test('report collection not found', function () {
  const command = create_command('run', 'wrong-id:also-wrong');
  const effect = run
    .collection(reader, create_state(), command)
    .cata(identity, constant);

  const report = effect({ http: stub });

  t.equal(typeof report, 'string', '');

  const lines = report.split('\n');
  t.equal(lines[1], 'could not find collection wrong-id', '');
});

test('report request not found', function () {
  const command = create_command('run', 'short-id:also-wrong');
  const effect = run
    .collection(reader, create_state(), command)
    .cata(identity, constant);

  const report = effect({ http: stub });

  t.equal(typeof report, 'string', '');

  const lines = report.split('\n');
  t.equal(lines[1], 'could not find request id also-wrong in short-id', '');
});

test('capture request error', async function () {
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

test('process one request', async function () {
  const path = 'short-id:also-short';
  const expected_request = reader
    .get_requests(create_state().collection, parse_query('id', path))
    .chain((res) => res[0]);

  const command = create_command('run-interactive', path);
  const effect = run
    .interactive(reader, create_state(), command)
    .map((eff) => bind(eff, prompt, next_action))
    .cata(identity, constant);

  const request = await effect({ http: stub });

  t.equal(request.url, expected_request.url, '');
});

test("don't allow multiple requests", function () {
  const command = create_command(
    'run-interactive',
    'short-id:also-short',
    'other:path'
  );
  const effect = run
    .interactive(reader, create_state(), command)
    .map((eff) => bind(eff, prompt, next_action))
    .cata(identity, constant);

  const report = effect({ http: stub });

  t.equal(typeof report, 'string', '');
  t.equal(report, "Can't process multiple requests in interactive mode", '');
});

test("don't allow request.data object", async function () {
  const command = create_command('run-interactive', 'short-id:json-data');
  const effect = run
    .interactive(reader, create_state(), command)
    .map((eff) => bind(eff, prompt, next_action))
    .cata(identity, constant);

  const report = await effect({ http: stub }).catch(identity);

  t.equal(typeof report, 'string', '');
  t.equal(report, "Can't render form. 'data' needs to be an array", '');
});

test('report collection not found', function () {
  const command = create_command('run', 'wrong-id:also-wrong');
  const effect = run
    .interactive(reader, create_state(), command)
    .map((eff) => bind(eff, prompt, next_action))
    .cata(identity, constant);

  const report = effect({ http: stub });

  t.equal(typeof report, 'string', '');

  t.equal(report, 'could not find collection wrong-id', '');
});

test('report request not found', function () {
  const command = create_command('run', 'short-id:also-wrong');
  const effect = run
    .interactive(reader, create_state(), command)
    .map((eff) => bind(eff, prompt, next_action))
    .cata(identity, constant);

  const report = effect({ http: stub });

  t.equal(typeof report, 'string', '');
  t.equal(report, 'could not find request id also-wrong in short-id', '');
});

suite('# cli - run-all command');

test('runs all requests in the schema', function () {
  const command = create_command('run-all', 'short-id:also-short');
  const effect = run
    .all(reader, create_state(), command.config)
    .cata(identity, constant);

  const requests = effect({ http: stub });

  t.equal(requests.length, expected.schema_request_count, 'got all requests');
});

suite('# cli - version command');

test('version is in sync with package.json', function () {
  const pkg_version = process.env.npm_package_version || false;

  t.ok(pkg_version, 'pkg_version is empty');
  t.equal(version(), 'v' + pkg_version, '');
});

suite('# cli - list command');

test('render list of requests paths', function () {
  const command = { name: 'list', args: ['path'] };
  const effect = list(reader, create_state(), command).cata(identity, constant);

  const result = effect({ log: stub });
  t.equal(result, expected.valid_paths.join('\n'), 'list of requests path');
});

suite('# cli - convert-to command');

test('render a list of "curl" commands', function () {
  const separator = ' \\\n';
  const join = (arr) => arr.join(separator);

  const command = create_command('convert-to', 'short-id:also-short,json-data');
  command.config = { syntax: 'curl', arg_separator: separator };

  const effect = convert_to(reader, create_state(), command).cata(
    identity,
    constant
  );

  const result = effect({ log: stub });
  t.equal(
    result,
    expected.curl_commands.flatMap(join).join('\n\n'),
    'list of curl commands'
  );
});

test('render a list of "httpie" commands', function () {
  const separator = ' \\\n';
  const join = (arr) => arr.join(separator);

  const command = create_command('convert-to', 'short-id:also-short,json-data');
  command.config = { syntax: 'httpie', arg_separator: separator };

  const effect = convert_to(reader, create_state(), command).cata(
    identity,
    constant
  );

  const result = effect({ log: stub });
  t.equal(
    result,
    expected.httpie_commands.flatMap(join).join('\n\n'),
    'list of httpie commands'
  );
});

test('render a list of "wget" commands', function () {
  const separator = ' \\\n';
  const join = (arr) => arr.join(separator);

  const command = create_command('convert-to', 'short-id:also-short');
  command.config = { syntax: 'wget', arg_separator: separator };

  const effect = convert_to(reader, create_state(), command).cata(
    identity,
    constant
  );

  const result = effect({ log: stub });
  t.equal(
    result,
    expected.wget_commands.flatMap(join).join('\n\n'),
    'list of wget commands'
  );
});

suite('# cli - markdown command');

test('render a "markdown" document', function () {
  const command = create_command('md');
  command.config = {
    syntax: 'curl',
    arg_separator: '\n',
    exclude: [parse_query('id', 'another:has-id')],
  };

  const effect = doc(reader, create_state(), command).cata(identity, constant);

  const result = effect({ log: stub });
  t.equal(result, expected.markdown, 'a markdown document');
});

suite('# cli - use-script command');

test('exported function gets command line arguments', async function () {
  const command = {
    name: 'use-script',
    args: ['somearg'],
    config: {
      path: './path-to-script.js',
      request_prop: 'id',
    },
  };

  const context = {};
  const add_global = (key, value) => (context[key] = value);

  const effect = run
    .use_script(reader, create_state(), command)
    .cata(identity, constant);

  const result = await effect({ add_global, fetch: stub, require: stub });

  t.deepEqual(result, ['somearg'], 'function receives the right arguments');
});

test('context object has the right shape', function () {
  const command = {
    name: 'use-script',
    args: ['somearg'],
    config: {
      path: './path-to-script.js',
      request_prop: 'id',
    },
  };

  const context = {};
  const add_global = (key, value) => (context[key] = value);

  const effect = run
    .use_script(reader, create_state(), command)
    .cata(identity, constant);

  effect({ add_global, fetch: stub, require: stub });

  t.ok('tinytina' in context, 'the context tinytina exists');

  t.deepEqual(
    ['argv', 'suite', 'FormData', 'print', 'http', 'json', 'env'],
    Object.keys(context.tinytina),
    'tinytina object has all the dependencies'
  );

  t.deepEqual(
    ['fetch', 'get_data', 'run', 'send', 'json'],
    Object.keys(context.tinytina.http),
    'tinytina.http has the right shape'
  );

  t.deepEqual(
    ['print', 'parse', 'readfile', 'writefile'],
    Object.keys(context.tinytina.json),
    'tinytina.json object has all the dependencies'
  );

  t.deepEqual(
    ['name', 'data'],
    Object.keys(context.tinytina.env),
    'tinytina.json the right shape'
  );
});

test('context object contains env variables', function () {
  const command = {
    name: 'use-script',
    args: ['somearg'],
    config: {
      path: './path-to-script.js',
      request_prop: 'id',
    },
  };

  const state = create_state();
  const context = {};
  const add_global = (key, value) => (context[key] = value);

  const effect = run
    .use_script(reader, state, command)
    .cata(identity, constant);

  effect({ add_global, fetch: stub, require: stub });

  t.deepEqual(
    context.tinytina.env.data,
    { ...state.env },
    'has state env variables'
  );
});

test('http utilities can extract data from the schema', async function () {
  const command = {
    name: 'use-script',
    args: ['somearg'],
    config: {
      path: './path-to-script.js',
      request_prop: 'id',
    },
  };

  const expected = {
    opts: {
      headers: {
        Authorization: '{api-key}',
      },
      method: 'POST',
    },
    url: 'http://localhost:3000/service/register',
    query: {
      stuff: 'this goes in the URL as a querystring',
    },
    files: {
      image: '/tmp/yourface.jpg',
    },
    type: 'form',
    body: {
      name: 'some test value',
      lastname: 'body-ish',
      email: 'not-real-deal',
      code: 'no-one-should-see-me',
    },
  };

  const query = 'short-id:also-short';
  const state = create_state();
  const context = {};
  const add_global = (key, value) => (context[key] = value);
  const fetch = (options, request) => [
    Promise.resolve({
      json: () => options(request[0]),
      text: () => options(request[0]),
    }),
  ];

  const effect = run
    .use_script(reader, state, command)
    .cata(identity, constant);

  effect({ add_global, fetch, require: stub });

  const { http } = context.tinytina;

  const request_data = await http.get_data(query);
  t.deepEqual(request_data, expected, '');

  const send_data = await http.send(query);
  t.deepEqual(send_data, expected, 'send can get the request data');

  const json_data = await http.json(query);
  t.deepEqual(json_data, expected, 'json can get the request data');
});

test('exposes external dependencies', function () {
  const baretest = require('baretest');
  const jsonfile = require('jsonfile');
  const jsome = require('jsome');
  const FormData = require('form-data');

  const command = {
    name: 'use-script',
    args: ['somearg'],
    config: {
      path: './path-to-script.js',
      request_prop: 'id',
    },
  };

  const context = {};
  const add_global = (key, value) => (context[key] = value);

  const effect = run
    .use_script(reader, create_state(), command)
    .cata(identity, constant);

  effect({ add_global, fetch: stub, require: stub });

  const { suite, json, print, FormData: MyFormData } = context.tinytina;

  t.ok(baretest == suite);
  t.ok(print == jsome);
  t.ok(jsonfile.readFile == json.readfile);
  t.ok(jsonfile.writeFile == json.writefile);
  t.ok(FormData == MyFormData);
});
