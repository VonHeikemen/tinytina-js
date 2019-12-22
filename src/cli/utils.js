function parse_query(request_prop, value) {
  let [collection_path = '', requests = ''] = value.split(':');

  return {
    collection: collection_path.split('.'),
    requests: requests ? requests.split(',') : [],
    request_prop
  };
}

function param_to_env(state, value) {
  let item = value.split(':');

  if (item.length === 2) {
    state[item[0]] = item[1];
  } else if (item.length > 2) {
    state[item[0]] = item.slice(1).join(':');
  }

  return state;
}

module.exports = {
  parse_query,
  param_to_env
};
