const t = require('assert').strict;

const schema = require('./fixtures/tinytina-schema.json');
const reader = require('../../src/schemas/tinytina');
const { parse_query } = require('../../src/cli/utils');

const expected = require('./fixtures/expected-data');

suite('# tinytina schema reader');

test('create state env from json schema', function() {
  const state = reader
    .create_state(schema, 'development', {
      extra_vars: { 'api-key': '123' },
      hide_vars: ['secret-thing']
    })
    .unwrap_or({});

  t.equal(state.env_name, 'development', '');
  t.deepEqual(state.hidden_env_vars, ['api-key', 'secret-thing'], '');
  t.deepEqual(state.env, expected.env, '');
});

test('populate collection array', function() {
  const state = reader.create_state(schema, 'development').unwrap_or({});

  t.ok(Array.isArray(state.collection), 'collection is an array');
  t.equal(state.collection.length, 2, 'extracted all collections');

  const [{ id: collection_1 }, { id: collection_2 }] = state.collection;
  t.deepEqual([collection_1, collection_2], ['short-id', 'another'], '');
});

test('get collection by id', function() {
  const state = reader.create_state(schema, 'development').unwrap_or({});

  const collection = reader.get_collection(state.collection, [
    'short-id',
    'oh-look'
  ]);
  t.ok(collection, 'collection is not empty');
  t.equal(collection.id, 'oh-look', '');
  t.equal(collection.name, 'A nested collection', '');
});

test('get request by id', function() {
  const state = reader.create_state(schema, 'development').unwrap_or({});
  const query = parse_query('id', 'short-id.oh-look:guess-filename');

  const requests = reader.get_requests(state.collection, query).unwrap_or([]);

  t.ok(requests.length, 'requests is not empty');
  t.equal(requests[0].id, 'guess-filename', '');
});

test('get request by name', function() {
  const state = reader.create_state(schema, 'development').unwrap_or({});
  const query = parse_query('name', 'short-id:the full name of the thing');

  const requests = reader.get_requests(state.collection, query).unwrap_or([]);

  t.ok(requests.length, 'requests is not empty');
  t.equal(requests[0].id, 'also-short', '');
});

test('get all requests from a collection', function() {
  const state = reader.create_state(schema, 'development').unwrap_or({});

  const requests = reader.get_all_requests(state.collection);

  t.ok(requests.length, 'requests is not empty');
  t.equal(requests.length, 8, 'got all requests in the schema');
});

test('transform request from schema to a fetch options object', function() {
  const state = reader
    .create_state(schema, 'development', {
      extra_vars: { 'api-key': '456' }
    })
    .unwrap_or({});
  const query = parse_query('id', 'short-id:also-short');

  const requests = reader.get_requests(state.collection, query).unwrap_or([]);

  const options = reader.build_fetch_options(state.env, requests[0]);

  t.deepEqual(options, expected.fetch_options, '');
});

test('fetch options: handle request.data object', function() {
  const expected_options = {
    ...expected.fetch_options,
    files: undefined,
    type: 'json',
    body: {
      ...expected.fetch_options.body,
      lastname: 'body',
      code: {
        payload: 'no-one-should-see-me'
      }
    }
  };

  const state = reader
    .create_state(schema, 'development', {
      extra_vars: { 'api-key': '456' }
    })
    .unwrap_or({});

  const query = parse_query('id', 'short-id:json-data');

  const requests = reader.get_requests(state.collection, query).unwrap_or([{}]);

  const options = reader.build_fetch_options(state.env, requests[0]);

  t.deepEqual(options, expected_options, '');
});

test('transform request from schema to a prompt options object', function() {
  const state = reader
    .create_state(schema, 'development', {
      extra_vars: { 'api-key': '456' }
    })
    .unwrap_or({});
  const query = parse_query('id', 'short-id:also-short');

  const requests = reader.get_requests(state.collection, query).unwrap_or([]);

  const options = reader.build_prompt_options(state, () => {}, requests[0]);

  t.ok(options, 'options is not nullish');

  options.result = '';
  t.deepEqual(options, expected.prompt_options, '');
});

test('get flatten list of requests metadata', function() {
  const expected = {
    name: 'deeply nested',
    description: 'A nested request',
    id: 'lonely-get',
    url: '{host}/service/download',
    depth: 3,
    path: 'short-id.oh-look.3rd-level'
  };

  const state = reader
    .create_state(schema, 'development', {
      extra_vars: { 'api-key': '456' }
    })
    .unwrap_or({});

  const requests = reader.list_requests(state.collection);

  t.ok(requests.length, 'requests is not empty');
  t.equal(requests.length, 8, 'got all requests in the schema');
  t.deepEqual(requests[4], expected, 'got expected metadata');
});

test('transform metadata list to a string', function() {
  const args = [
    {
      name: 'request 1',
      description: '',
      id: 'req-1',
      url: '{host}/service/download',
      depth: 1,
      path: 'short-id'
    },
    {
      name: 'request 2',
      description: 'a request',
      id: 'req-2',
      url: '{host}/service/download',
      depth: 2,
      path: 'short-id.oh-look'
    },
    {
      name: 'request 3',
      description: 'an id-less request',
      id: '',
      url: '{host}/service/request-3',
      depth: 2,
      path: 'short-id.oh-look'
    }
  ];

  const expected = `
${args[0].path}:${args[0].id}
    ${args[0].name}
${args[1].path}:${args[1].id}
    ${args[1].name}
    ${args[1].description}
${args[2].path}
    ${args[2].url}
    ${args[2].name}
    ${args[2].description}`;

  const list = reader.list_to_string('', args);
  t.equal(list, expected, '');
});
