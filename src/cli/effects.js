const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const stream_pipeline = promisify(require('stream').pipeline);

const { URLSearchParams } = require('url');
const fetch = require('node-fetch');
const FormData = require('form-data');

const color_support = require('color-support').hasBasic;
const jsome = require('jsome');
const c = require('ansi-colors');

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

const { http } = require('../common/request')(
  fetch,
  URLSearchParams,
  FormData,
  handle_files,
  handle_download
);

const {
  bind,
  is_nil,
  is_empty,
  map,
  then,
  pipe,
  promise_all
} = require('../common/utils');
const { Ok } = require('../common/Result');

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

function log(raw_output) {
  return async arg => {
    raw_output ? console.log(arg) : safe_parse(arg);
  };
}

function http_client(get_options, raw_output) {
  return requests => {
    const get_text = res => res.text();
    const show_response = promise =>
      promise.then(get_text).then(log(raw_output));

    const run = pipe(
      bind(http, get_options),
      bind(map, show_response),
      promise_all
    );

    return run(requests);
  };
}

function log_effect(raw_output, fn) {
  const effect = ({ log }) => log(raw_output)(fn());
  return Ok(effect);
}

function pretty_err(debug, error) {
  if (debug) {
    return error;
  }

  let title = c.bold.white('Whoops, something went wrong');
  let msg = `\n${title}\n\n`;

  if (is_empty(error)) {
    msg +=
      'Something weird and unexpected happened while processing the request.';
    return msg;
  }

  msg += `${c.bold.red('Error:')} `;
  if (typeof error == 'string') {
    msg += error;
    return msg;
  }

  if (!is_nil(error.message)) {
    msg += error.message;
  }

  if (!is_nil(error.info)) {
    msg += '\n\n' + c.blue('Info: ') + error.info;
  }

  return msg;
}

module.exports = {
  http: http_client,
  log,
  log_effect,
  pretty_err
};
