function create_form(type, params, handle_files) {
  let form = new type();

  for (let key in params) {
    form.append(key, params[key]);
  }

  if (handle_files) {
    handle_files(form);
  }

  return form;
}

function make_post(fetch, URLSearchParams, FormData, handle_files) {
  return {
    json(url, body, files, opts) {
      return fetch(url, {
        method: 'POST',
        ...opts,
        headers: {
          ...(opts.headers ? opts.headers : {}),
          'Content-type': 'application/json'
        },
        body: JSON.stringify(body)
      });
    },
    form(url, body, files, opts) {
      const handler = form => handle_files(files, form);
      return fetch(url, {
        method: 'POST',
        ...opts,
        body: create_form(FormData, body, handler)
      });
    },
    urlencoded(url, body, files, opts) {
      return fetch(url, {
        method: 'POST',
        ...opts,
        body: create_form(URLSearchParams, body)
      });
    }
  };
}

function build_query_string(URLSearchParams, query) {
  let params = new URLSearchParams();

  for (let param in query) {
    params.append(param, query[param]);
  }

  return '?' + params.toString();
}

function make_request(http, params) {
  const { opts, type, body, files } = params;

  let full_url = params.url;
  if (params.query) {
    full_url += build_query_string(http.URLSearchParams, params.query);
  }

  const request =
    opts.method === 'GET'
      ? () => http.get(full_url, opts)
      : () => http.post[type](full_url, body, files, opts);

  if (params.output) {
    return http.handle_download(request, params.output, params.url);
  }

  return request();
}

function run(http, create_options, requests) {
  return requests.map(params => http(create_options(params)));
}

module.exports = function(
  fetch,
  URLSearchParams,
  FormData,
  handle_files,
  handle_download
) {
  const http = make_request.bind(null, {
    get: fetch,
    post: make_post(fetch, URLSearchParams, FormData, handle_files),
    URLSearchParams,
    handle_download
  });

  return {
    http: run.bind(null, http)
  };
};
