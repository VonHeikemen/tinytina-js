const { Form, Toggle } = require('enquirer');
const { bind, is_nil, is_empty, reduce, reject } = require('../common/utils');

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
  })
    .run()
    .catch(e => false);

  return answer ? fn() : true;
}

function prompt(options) {
  return new Form(options).run();
}

async function run_interactive(
  { run, prompt, next_action },
  create_options,
  request
) {
  const handle_error = e =>
    Promise.reject(e === '' ? 'Request cancelled by user' : e);

  const run_prompt = async req => {
    const options = create_options(form_to_request, req);
    const new_req = await prompt(options);

    await run(new_req);
    return next_action('Repeat request', bind(run_prompt, new_req));
  };

  return run_prompt(request)
    .altchain(reject)
    .catch(handle_error);
}

module.exports = {
  interactive: run_interactive,
  prompt,
  next_action
};
