#! /usr/bin/env node

require('array-flat-polyfill');

const fs = require('fs');
const file_exists = fs.existsSync;

const jsonfile = require('jsonfile');

const { prompt, next_action } = require('./cli/interactive');
const {
  run,
  help,
  version,
  list,
  convert_to,
  create_schema,
  doc,
} = require('./cli/commands.js');
const { process_args } = require('./cli/utils');
const { add_global, fetch, http, log, pretty_err } = require('./cli/effects');
const { create_reader } = require('./common/reader');
const { bind, is_nil, is_empty, identity, reject } = require('./common/utils');

async function main({
  command,
  env_name,
  env_vars,
  hide_vars,
  schema_path,
  schema_type,
  err = false,
}) {
  if (err) {
    return Promise.reject(err);
  }

  let state = {};
  let reader = create_reader(schema_type);

  const create_state = async () => {
    try {
      var schema = await jsonfile.readFile(schema_path);
    } catch (err) {
      return Promise.reject(err.message);
    }

    const state = reader.create_state(schema, env_name, {
      extra_vars: env_vars,
      hide_vars,
    });

    if (state.is_err) {
      return state.altchain(reject);
    }

    return state.unwrap_or({});
  };

  switch (command.name) {
    case 'help':
      return help();
    case 'version':
      return version();
    case 'list':
      state = await create_state();
      return list(reader, state, command);
    case 'run':
      state = await create_state();
      return run.collection(reader, state, command);
    case 'run-interactive':
      state = await create_state();
      return run
        .interactive(reader, state, command)
        .map((eff) => bind(eff, prompt, next_action));
    case 'run-all':
      state = await create_state();
      return run.all(reader, state, command.config);
    case 'convert-to':
      state = await create_state();
      return convert_to(reader, state, command);
    case 'init':
      return create_schema(reader, command);
    case 'markdown':
      state = await create_state();
      return doc(reader, state, command);
    case 'use-script':
      state = await create_state();
      return run.use_script(reader, state, command);
  }
}

main(process_args(process.argv.slice(2)))
  .then((res) => res.cata(identity, reject))
  .then((effect) => effect({ add_global, fetch, http, log, require, jsonfile, file_exists }))
  .catch((e) => console.error(pretty_err(process.argv.includes('--debug'), e)));
