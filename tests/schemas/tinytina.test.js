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
  t.equal(requests.length, 6, 'got all requests in the schema');
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
