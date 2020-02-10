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
  reduce,
  pipe,
  what_is
} = require('../common/utils');

function escape_double_quotes(str) {
  return str.replace(/"/g, '\\"');
}

function valid_post_type(type) {
  return ['urlencoded', 'json', 'form'].includes(type);
}

function get_method(request) {
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

  return method.toUpperCase();
}

function get_post_type(request) {
  let type = valid_post_type(request.type) ? request.type : 'urlencoded';

  if (what_is(request.data).object()) {
    type = 'json';
  } else if (request.files && type == 'urlencoded') {
    type = 'form';
  }

  return type;
}

function full_url_request(URLSearchParams, env, request) {
  const parse = expand(env);

  let url = request.url;
  let form = new URLSearchParams();

  if (is_empty(request.query)) {
    return request;
  }

  for (let param of request.query) {
    form.append(param.name, parse(param.value));
  }

  url += url.includes('?') ? form.toString() : `?${form.toString()}`;

  return {
    ...request,
    query: [],
    url
  };
}

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

  let new_env = create_env(name, env);
  state.env = map(expand(new_env), new_env);
  state.env_name = name;

  if (schema.hide) {
    state.hidden_env_vars = schema.hide;
  }

  if (hide_vars.length) {
    state.hidden_env_vars = state.hidden_env_vars.concat(hide_vars);
  }

  state.name = get_or('', 'name', schema);
  state.description = get_or('', 'description', schema);

  return Result.Ok(state);
}

function query_id(collection, empty, ids) {
  let res = [];
  let query = new Set(ids);
  for (let request of collection) {
    for (let index of query) {
      if (index === request.id) {
        res.push(request);
        query.delete(index);
        if (query.size === 0) {
          return Result.Ok(res);
        }
      }
    }
  }

  return empty.catchmap(msg => msg.concat(Array.from(query).join(', ')));
}

function query_prop(collection, empty, query) {
  let lowercase_query = map(str => str.toLowerCase(), query.requests);
  let res = filter(
    item =>
      lowercase_query.includes((item[query.request_prop] || '').toLowerCase()),
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
    return Result.Err(
      `could not find collection ${query.collection.join('.')}`
    );
  }

  if (is_empty(collection.requests)) {
    return Result.Err(
      `the collection ${query.collection.join('.')} has no requests`
    );
  }

  if (is_empty(query.requests)) {
    return Result.Ok(collection.requests);
  }

  const empty = Result.Err(`could not find request ${query.request_prop} `);
  let result = empty;

  switch (query.request_prop) {
    case 'id':
      result = query_id(collection.requests, empty, query.requests);
      break;
    case 'name':
    case 'description':
      result = query_prop(collection, empty, query);
      break;
  }

  const append_err = msg => msg.concat(` in ${collection.id}`);
  return result.catchmap(append_err);
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

  result.opts.method = get_method(request);

  let output_path = get_or(false, 'output.path', request);
  if (output_path) {
    result.output = {};
    result.output.path = parse(output_path);
    result.output.filename = parse(get_or('', 'output.filename', request));
  }

  if (result.opts.method === 'GET') {
    return result;
  }

  result.files = expand_data(request.files);
  result.type = get_post_type(request);

  if (result.type == 'json') {
    result.body = parse(request.data);
  } else {
    result.body = expand_data(request.data);
  }

  return result;
}

function flatten_requests(reducer, collection, depth = 15, result = []) {
  for (let item of collection) {
    let { requests = [] } = item;
    item.depth = depth;
    result = reducer(result, requests, item);

    if (depth > 1 && item.collections) {
      flatten_requests(reducer, item.collections, depth - 1, result);
    }
  }

  return result;
}

function get_all_requests(collection) {
  const fn = (acc, req) => (acc.push(...req), acc);
  return flatten_requests(fn, collection);
}

function list_requests(collection) {
  let path = '';
  let max_depth = 15;
  let curr_depth = max_depth;
  let prev_depth = max_depth;
  const make_path = (depth, id) => {
    if (id == null) {
      return id;
    }

    if (prev_depth === depth) {
      path = id;
    }

    if (prev_depth > depth && curr_depth != depth) {
      curr_depth = depth;
      path += `.${id}`;
    }

    return path;
  };

  const get_metadata = src => i => ({
    name: i.name || '',
    description: i.description || '',
    id: i.id || '',
    url: i.url || '',
    depth: max_depth + 1 - src.depth,
    path: make_path(src.depth, src.id)
  });

  const fn = (acc, req, src) => {
    const items = map(get_metadata(src), req);
    acc.push(...items);
    return acc;
  };

  return flatten_requests(fn, collection);
}

function list_to_string(show, list) {
  const to_string = req => {
    let str = req.path;
    switch (show) {
      case 'path':
        return req.id ? `${str}:${req.id}` : '';
      case 'full':
      default:
        const id = req.id ? `${str}:${req.id}` : `${str}\n    ${req.url}`;
        return (
          id +
          (req.name ? `\n    ${req.name}` : '') +
          (req.description ? `\n    ${req.description}` : '')
        );
    }
  };

  const fn = (acc, item) => {
    const result = to_string(item);
    return is_empty(result) ? acc : acc.concat('\n', result);
  };

  return reduce(fn, '', list);
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

  let method = get_method(request);

  if (method != 'GET' && what_is(request.data).object()) {
    return { error: "Can't render form. 'data' needs to be an array" };
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

function build_command_curl(env, request, { arg_separator }) {
  const parse = expand(env);
  const safe_parse = pipe(parse, escape_double_quotes);
  const type = get_post_type(request);

  let result = [`curl --request ${get_method(request)}`];
  const header = ({ name, value }) =>
    `--header "${name}: ${safe_parse(value)}"`;
  const form_data = ({ name, value }) =>
    `--form "${name}=${safe_parse(value)}"`;
  const form_file = ({ name, value }) =>
    `--form "${name}=@${safe_parse(value)}"`;
  const form_urlencoded = ({ name, value }) =>
    `--data "${name}=${safe_parse(value)}"`;

  if (!is_empty(request.headers)) {
    result.push(...map(header, request.headers));
  }

  if (!is_empty(request.data)) {
    switch (type) {
      case 'form':
        result.push(...map(form_data, request.data));
        break;
      case 'urlencoded':
        result.push(...map(form_urlencoded, request.data));
        break;
      case 'json':
        const content_type = (request.headers || []).find(header =>
          header.value.toLowerCase().includes('content-type: application/json')
        );
        if (is_empty(content_type)) {
          result.push('--header "Content-Type: application/json"');
        }

        result.push(`--data '${JSON.stringify(parse(request.data), null, 2)}'`);
        break;
    }
  }

  if (!is_empty(request.files) && type == 'form') {
    result.push(...map(form_file, request.files));
  }

  result.push(`"${parse(request.url)}"`);

  return result.join(arg_separator);
}

function build_command_httpie(env, request, { arg_separator }) {
  const parse = expand(env);
  const safe_parse = pipe(parse, escape_double_quotes);
  const method = get_method(request);
  const type = get_post_type(request);

  let result = [];

  switch (type) {
    case 'form':
      result.push(`http --form ${method} "${parse(request.url)}"`);
      break;
    case 'json':
      result.push(`http --json ${method} "${parse(request.url)}"`);
      break;
    case 'urlencoded':
    default:
      result.push(`http ${method} "${parse(request.url)}"`);
      break;
  }

  if (!is_empty(request.headers)) {
    const header = ({ name, value }) => `${name}:"${safe_parse(value)}"`;
    result.push(...map(header, request.headers));
  }

  if (!is_empty(request.query)) {
    const query_data = ({ name, value }) => `${name}=="${safe_parse(value)}"`;
    result.push(...map(query_data, request.query));
  }

  if (!is_empty(request.data)) {
    switch (type) {
      case 'form':
        const form_data = ({ name, value }) => `${name}="${safe_parse(value)}"`;
        result.push(...map(form_data, request.data));
        break;
      case 'urlencoded':
        const form_urlencoded = ({ name, value }) =>
          `${name}="${safe_parse(value)}"`;
        result.push(...map(form_urlencoded, request.data));
        break;
      case 'json':
        for (let [name, value] of Object.entries(request.data)) {
          const is = what_is(value);
          switch (true) {
            case is.object():
            case is.array():
              result.push(`${name}:='${JSON.stringify(parse(value))}'`);
              break;
            case is.undefined():
            case is.null():
            case is.number():
              result.push(`${name}:="${value}"`);
              break;
            default:
              result.push(`${name}="${safe_parse(value)}"`);
              break;
          }
        }
        break;
    }
  }

  if (!is_empty(request.files) && type == 'form') {
    const form_file = ({ name, value }) => `${name}@${parse(value)}`;
    result.push(...map(form_file, request.files));
  }

  return result.join(arg_separator);
}

function build_command_wget(URLSearchParams, env, request, { arg_separator }) {
  const parse = expand(env);
  const safe_parse = pipe(parse, escape_double_quotes);
  const type = get_post_type(request);

  let result = [`wget --method ${get_method(request)}`];

  if (!is_empty(request.headers)) {
    const header = ({ name, value }) =>
      `--header "${name}: ${safe_parse(value)}"`;
    result.push(...map(header, request.headers));
  }

  if (!is_empty(request.data)) {
    const data = new URLSearchParams();
    for (let param of request.data) {
      what_is(param.value).object()
        ? data.append(param.name, JSON.stringify(parse(param.value)))
        : data.append(param.name, parse(param.value));
    }

    result.push(`--body-data "${data.toString()}"`);
  }

  result.push(`"${parse(request.url)}"`);

  return result.join(arg_separator);
}

function build_shell_command(
  URLSearchParams,
  state,
  { syntax, arg_separator }
) {
  switch (syntax) {
    case 'curl':
      return Result.Ok(req =>
        build_command_curl(
          state.env,
          full_url_request(URLSearchParams, state.env, req),
          { arg_separator }
        )
      );
    case 'httpie':
      return Result.Ok(req =>
        build_command_httpie(state.env, req, { arg_separator })
      );
    case 'wget':
      return Result.Ok(req =>
        build_command_wget(
          URLSearchParams,
          state.env,
          full_url_request(URLSearchParams, state.env, req),
          { arg_separator }
        )
      );
    default:
      return Result.Err({
        message: `invalid parameter ${syntax}`,
        info: 'The supported parameters are "curl", "httpie" and "wget"'
      });
  }
}

function build_doc_markdown(
  URLSearchParams,
  state,
  { syntax, arg_separator, exclude }
) {
  const parse = expand(state.env);

  const exclude_query = map(
    q => ({ ...q, collection: q.collection.join('.') }),
    exclude
  );

  const example_cmd = build_shell_command(URLSearchParams, state, {
    arg_separator,
    syntax
  })
    .map(cmd => request => `\`\`\`\n${cmd(request)}\n\`\`\`\n\n`)
    .unwrap_or(() => '');

  const heading = num => str => `${'#'.repeat(num)} ${str}\n`;
  const h2 = heading(2);
  const h3 = heading(3);
  const h4 = heading(4);

  const join_lines = str => (Array.isArray(str) ? str.join('\n') : str);
  const multiline = str => `\n${join_lines(str)}\n\n`;

  const get_extra_headers = function(data) {
    if (!Array.isArray(data)) {
      return [];
    }

    let headers = new Set();

    for (const param of data) {
      Object.keys(param.metadata || {}).forEach(k => headers.add(k));
    }

    return Array.from(headers);
  };

  const create_table = function(data) {
    let headers = get_extra_headers(data);
    let body = '\n| ';

    const cell = str => ` ${is_nil(str) ? '' : str} |`;

    body += cell('Field');
    body += cell('Value');

    for (const h of headers) {
      body += cell(h);
    }

    body += '\n|';

    body += cell('---');
    body += cell('---');

    for (const h of headers) {
      body += cell('---');
    }

    body += '\n';

    for (const param of data) {
      body += '|';

      body += cell(param.name);
      body += cell(parse(param.value));

      if (!is_empty(headers)) {
        for (const h of headers) {
          body += cell(get_or('', ['metadata', h], param));
        }
      }

      body += '\n';
    }

    return body + '\n';
  };

  const collection_to_markdown = function(path, collections) {
    let body = '';
    for (const collection of collections) {
      const current_path = path + collection.id;
      let filter = exclude_query.find(q => q.collection == current_path);

      if (is_nil(filter)) {
        filter = { requests: [], request_prop: 'id' };
      } else if (is_empty(filter.requests)) {
        continue;
      }

      body += h2(collection.name || collection.id);

      if (collection.description) {
        body += multiline(collection.description);
      }

      for (const request of collection.requests) {
        if (filter.requests.includes(request.id)) {
          continue;
        }

        body += h3(request.name || request.id || '-');

        if (request.description) {
          body += multiline(request.description);
        }

        if (request.headers) {
          body += h4('Headers');
          body += create_table(request.headers);
        }

        if (request.query) {
          body += h4('Query String');
          body += create_table(request.query);
        }

        if (is_empty(request.data) && request.files) {
          body += h4('Data');
          body += create_table(request.files);
        } else if (Array.isArray(request.data)) {
          body += h4('Data');
          let data = is_empty(request.files)
            ? request.data
            : request.data.concat(request.files);

          body += create_table(data);
        } else if (Array.isArray(request['data-description'])) {
          body += h4('Data');
          body += create_table(request['data-description']);
        }

        body += example_cmd(request);
      }

      if (!is_empty(collection.collections)) {
        body += collection_to_markdown(
          `${current_path}.`,
          collection.collections
        );
      }
    }

    return body;
  };

  let docs = '';

  if (state.name) {
    docs += `# ${state.name}\n`;
  }

  if (state.description) {
    docs += multiline(state.description);
  }

  docs += collection_to_markdown('', state.collection);

  return docs;
}

module.exports = {
  create_state,
  full_url_request,
  build_fetch_options,
  get_requests,
  get_all_requests,
  get_collection,
  build_prompt_options,
  list_requests,
  list_to_string,
  build_command_curl,
  build_command_httpie,
  build_command_wget,
  build_shell_command,
  build_doc_markdown
};
