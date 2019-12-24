const expand = require('../common/expand')();
const { init_state, create_env } = require('../common/state');
const Result = require('../common/Result');
const {
  get_or,
  map,
  shallow_copy,
  is_empty,
  is_nil,
  filter,
  reduce
} = require('../common/utils');

function create_state(schema, name, { extra_vars = {}, hide_vars = [] } = {}) {
  let state = init_state();

  if (is_nil(schema.collections)) {
    return Result.Err('could not find collections in schema');
  }

  let env = {};

  state.collection = schema.collections;
  env.global = shallow_copy(schema.globals) || {};
  env.raw = shallow_copy(schema.envs) || {};
  env.extra = extra_vars;

  if (schema.hide) {
    state.hidden_env_vars = schema.hide;
  }

  if (hide_vars.length) {
    state.hidden_env_vars = state.hidden_env_vars.concat(hide_vars);
  }

  let new_env = create_env(name, env);
  state.env = map(expand(new_env), new_env);
  state.env_name = name;

  return Result.Ok(state);
}

function query_id(collection, empty, ids) {
  let res = [];
  let query = [...ids];
  for (let request of collection) {
    for (let index in query) {
      if (query[index] === request.id) {
        res.push(request);
        query.splice(index, 1);
        if (query.length === 0) {
          return Result.Ok(res);
        }
      }
    }
  }

  return res.length ? Result.Ok(result) : empty;
}

function query_prop(collection, empty, query) {
  let lowercase_query = map(str => str.toLowerCase(), query.requests);
  let res = filter(
    item => lowercase_query.includes(item[query.request_prop].toLowerCase()),
    collection.requests
  );

  return res.length ? Result.Ok(res) : empty;
}

function get_collection(collections, path) {
  if (is_empty(path)) {
    return collections;
  }

  let query = path[0];

  for (let item of collections) {
    let match = item.id === query;
    if (match && path.length === 1) {
      return item;
    }

    if (match) {
      return get_collection(item.collections || [], path.slice(1));
    }
  }

  return null;
}

function get_requests(collections, query) {
  let collection = get_collection(collections, query.collection);

  if (is_empty(collection)) {
    return Result.Err('could not find collection');
  }

  if (is_empty(collection.requests)) {
    return Result.Err('the collection has no requests');
  }

  if (is_empty(query.requests)) {
    return Result.Ok(collection.requests);
  }

  const empty = Result.Err(`could not find request ${query.request_prop}`);

  switch (query.request_prop) {
    case 'id':
      return query_id(collection.requests, empty, query.requests);
    case 'name':
    case 'description':
      return query_prop(collection, empty, query);
  }

  return empty;
}

function valid_post_type(type) {
  return ['urlencoded', 'json', 'form'].includes(type);
}

function build_fetch_options(env, request) {
  const parse = expand(env);
  const parse_form = function(state, input) {
    state[input.name] = parse(input.value);
    return state;
  };

  const expand_data = data => reduce(parse_form, {}, data);

  let result = { opts: {} };
  result.url = parse(request.url);

  result.opts.headers = expand_data(request.headers);
  result.query = expand_data(request.query);

  result.opts.method = is_empty(request.method)
    ? 'GET'
    : request.method.toUpperCase();

  let output_path = get_or(false, 'output.path', request);
  if (output_path) {
    result.output = {};
    result.output.path = parse(output_path);
    result.output.filename = parse(get_or('', 'output.filename', request));
  }

  if (result.opts.method === 'GET') {
    return result;
  }

  result.body = expand_data(request.data);
  result.files = expand_data(request.files);

  result.type = valid_post_type(request.type) ? request.type : 'urlencoded';

  if (request.files && result.type != 'form') {
    result.type = 'form';
  }

  return result;
}

function flatten_requests(collection, depth = 15, result = []) {
  for (let item of collection) {
    let { requests = [] } = item;
    result.push(...requests);

    if (depth > 1 && item.collections) {
      flatten_requests(item.collections, depth - 1, result);
    }
  }

  return result;
}

function get_all_requests(collection) {
  return flatten_requests(collection);
}

function parse_val(state, value) {
  if (is_empty(value)) {
    return value;
  }

  const not_hidden = (val, key) => !state.hidden_env_vars.includes(key);
  let parse = expand(filter(not_hidden, state.env));

  return parse(parse(String(value)));
}

function build_prompt_options(state, form_to_request, request) {
  let payload = request._;
  let opts = { name: 'request', message: '', choices: [] };

  switch (true) {
    case !is_nil(request.description):
      opts.message = request.description;
      break;
    case !is_nil(request.name):
      opts.message = request.name;
      break;
    case !is_nil(request.id):
      opts.message = request.id;
      break;
    case !is_nil(payload.description):
      opts.message = payload.description;
      break;
    default:
      opts.message = 'Request data:';
      break;
  }

  let method = request.method;

  if (is_empty(method)) {
    switch (true) {
      case !is_nil(request.files):
      case !is_nil(request.data):
        method = 'POST';
        break;
      default:
        method = 'GET';
        break;
    }
  }

  const form_header = message => [
    { name: '_', message: '  ', role: 'separator', initial: '  ' },
    { name: '_', message, role: 'separator', initial: '  ' },
    { name: '_', role: 'separator', initial: '  ' }
  ];

  const form_input = prefix => ({ name, value }) => ({
    name: `${prefix}.${name}`,
    message: name,
    initial: parse_val(state, value)
  });

  const to_choice = (header, key) =>
    request[key]
      ? form_header(header).concat(map(form_input(key), request[key]))
      : [];

  let choices = [
    {
      name: '_',
      message: 'Env',
      initial: `${state.env_name || ''} ✖`,
      disabled: '  '
    },
    {
      name: 'url',
      message: 'URL',
      initial: parse_val(state, request.url)
    },
    {
      name: 'method',
      message: 'Method',
      initial: method
    }
  ];

  opts.choices = choices.concat(
    to_choice('Headers', 'headers'),
    to_choice('Query', 'query'),
    to_choice('Data', 'data'),
    to_choice('Files', 'files')
  );

  const add_payload = form => ({ ...form, _: { description: opts.message } });

  opts.result = form => form_to_request(add_payload(form));

  return opts;
}

module.exports = {
  create_state,
  build_fetch_options,
  get_requests,
  get_all_requests,
  get_collection,
  build_prompt_options
};
