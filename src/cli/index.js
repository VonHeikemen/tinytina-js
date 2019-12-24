const fs = require('fs');
const path = require('path');
const { URLSearchParams } = require('url');
const fetch = require('node-fetch');
const FormData = require('form-data');
const color_support = require('color-support').hasBasic;
const jsome = require('jsome');
const c = require('ansi-colors');

const { promisify } = require('util');
const stream_pipeline = promisify(require('stream').pipeline);

const interactive = require('./interactive');
const help = require('./help');
const version = require('./version');

const { http } = require('../common/request')(
  fetch,
  URLSearchParams,
  FormData,
  handle_files,
  handle_download
);

const { bind, is_empty } = require('../common/utils');

jsome.colors = {
  num: 'magenta', // stands for numbers
  str: 'green', // stands for strings
  bool: 'magenta', // stands for booleans
  regex: 'blue', // stands for regular expressions
  undef: 'magenta', // stands for undefined
  null: 'magenta', // stands for null
  attr: 'cyan', // objects attributes -> { attr : value }
  quot: 'white', // strings quotes -> "..."
  punc: 'white', // commas seperating arrays and objects values -> [ , , , ]
  brack: 'white' // for both {} and []
};

jsome.params.lintable = true;
jsome.params.colored = color_support;
c.enabled = color_support;

function handle_files(files, form) {
  for (let key in files) {
    form.append(key, fs.createReadStream(files[key]));
  }
}

async function handle_download(http_request, output, url) {
  const response = await http_request;
  let filename = output.filename;

  if (is_empty(filename)) {
    const content_disposition =
      response.headers.get('Content-Disposition') || '';

    const filename_match = content_disposition.match(
      /(filename=|filename\*='')(.*)$/
    );

    filename = filename_match
      ? filename_match[2]
      : url.split('/').pop() + '_' + Date.now();
  }

  const dest = path.join(output.path, filename);
  await stream_pipeline(response.body, fs.createWriteStream(dest));

  return { text: () => Promise.resolve('file downloaded at ' + dest) };
}

function safe_parse(text) {
  try {
    return jsome.parse(text);
  } catch (err) {
    return jsome(text);
  }
}

async function run_requests(reader, env, config, requests) {
  const create_options = bind(reader.build_fetch_options, env);
  const responses = await Promise.all(http(requests, create_options));

  const show = config.raw_output ? console.log : safe_parse;

  for (let res of responses) {
    await res.text().then(show);
  }
}

function run_collection(reader, state, config, query) {
  return reader
    .get_requests(state.collection, query)
    .chain(bind(run_requests, reader, state.env, config))
    .altchain(e => Promise.reject(e));
}

function run_all(reader, state, config) {
  let all = reader.get_all_requests(state.collection);
  return run_requests(reader, state.env, config, all);
}

function run(reader, state, { config, args }) {
  if (is_empty(args)) {
    return Promise.reject(
      'Empty argument list for "run"\n\n' +
        c.blue('Info: ') +
        'To run all requests use the "run-all" command'
    );
  }

  if (config.interactive_mode) {
    if (args.length > 1 || args[0].requests.length > 1) {
      return Promise.reject(
        "Can't process multiple requests in interactive mode"
      );
    }

    const run_request = req => run_requests(reader, state.env, config, [req]);
    return interactive(run_request, reader, state, args[0]);
  }

  let requests = args.map(function(query) {
    return run_collection(reader, state, config, query);
  });

  return Promise.all(requests);
}

module.exports = {
  run: {
    all: run_all,
    collection: run
  },
  help,
  version
};
