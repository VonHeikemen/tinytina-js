const { Form, Toggle } = require('enquirer');
const { is_nil, is_empty, reduce } = require('../common/utils');

function form_to_request(form) {
  const to_request = function(state, value, key) {
    let input_key = key.split('.');

    if (input_key.length < 2) {
      return state;
    }

    const allowed = ['headers', 'query', 'data', 'files'];
    const request_key = input_key[0];

    if (allowed.includes(request_key)) {
      const data = { name: input_key[1], value };

      is_nil(state[request_key])
        ? (state[request_key] = [data])
        : state[request_key].push(data);
    }

    return state;
  };

  let result = reduce(to_request, {}, form);
  result.url = form.url;
  result.method = form.method;
  result._ = form._;

  return result;
}

async function next_action(message, fn) {
  const answer = await new Toggle({
    message,
    name: 'question',
    enabled: 'Yes',
    disabled: 'No'
  }).run();

  return answer ? fn() : true;
}

async function run_interactive(run, reader, state, query) {
  if (is_empty(query.collection)) {
    return Promise.reject('Invalid run query');
  }

  let [result, error] = reader.get_requests(state.collection, query);

  if (error) {
    return Promise.reject(error);
  }

  const run_prompt = async req => {
    const options = reader.build_prompt_options(state, form_to_request, req);
    const new_req = await new Form(options).run();

    await run(new_req);
    return next_action('Repeat request', () => run_prompt(new_req));
  };

  return run_prompt(result[0]).catch(e =>
    Promise.reject(e === '' ? 'Request cancelled by user' : e)
  );
}

module.exports = run_interactive;
