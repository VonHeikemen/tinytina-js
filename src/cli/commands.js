const { interactive } = require('./interactive');
const { log_effect } = require('./effects');
const help = require('./help');
const version = require('./version');

const { bind, is_empty, map, reduce } = require('../common/utils');
const Result = require('../common/Result');

function run_all(reader, state, config) {
  const create_options = bind(reader.build_fetch_options, state.env);
  let all = reader.get_all_requests(state.collection);

  function _effect({ http }) {
    return http(create_options, config.raw_output)(all);
  }

  return Result.Ok(_effect);
}

function run_collection(reader, state, { config, args }) {
  if (is_empty(args)) {
    return Result.Err({
      message: 'Empty argument list for "run"',
      info: 'To run all requests use the "run-all" command'
    });
  }

  const create_options = bind(reader.build_fetch_options, state.env);

  let requests = reduce(
    function(acc, query) {
      reader.get_requests(state.collection, query).cata(
        result => acc.success.push(result),
        err => acc.failed.push(err)
      );

      return acc;
    },
    { success: [], failed: [] },
    args
  );

  if (requests.failed.length) {
    return Result.Err('Search failed:\n' + requests.failed.join('\n'));
  }

  function _effect({ http }) {
    return Promise.all(
      map(http(create_options, config.raw_output), requests.success)
    );
  }

  return Result.Ok(_effect);
}

function run_interactive(reader, state, { config, args }) {
  if (args.length > 1 || args[0].requests.length > 1) {
    return Result.Err("Can't process multiple requests in interactive mode");
  }

  const request = reader
    .get_requests(state.collection, args[0])
    .map(res => res[0]);

  if (request.is_err) {
    return request;
  }

  const fetch_options = bind(reader.build_fetch_options, state.env);
  const prompt_options = bind(reader.build_prompt_options, state);

  function _effect(prompt, next_action, { http }) {
    const run = req => http(fetch_options, config.raw_output)([req]);
    return interactive(
      { run, next_action, prompt },
      prompt_options,
      request.unwrap_or({})
    );
  }

  return Result.Ok(_effect);
}

module.exports = {
  run: {
    all: run_all,
    collection: run_collection,
    interactive: run_interactive
  },
  help: bind(log_effect, true, help),
  version: bind(log_effect, true, version)
};
