function identity(arg) {
  return arg;
}

function constant(arg) {
  return () => arg;
}

function is_nil(arg) {
  return arg == null;
}

function is_empty(arg) {
  return is_nil(arg) || arg.length === 0;
}

function what_is(arg) {
  return Object.prototype.toString.call(arg);
}

function map(fn, arg) {
  if (arg == null) {
    return arg;
  }

  if (typeof arg.map === 'function') {
    return arg.map(fn);
  }

  let is = what_is(arg);

  if (is === '[object Object]') {
    let res = {};
    for (let key in arg) {
      res[key] = fn(arg[key], key);
    }

    return res;
  }

  if (is === '[object Promise]') {
    return arg.then(fn);
  }
}

function filter(fn, arg) {
  if (arg == null) {
    return arg;
  }

  if (typeof arg.filter === 'function') {
    return arg.filter(fn);
  }

  let is = what_is(arg);

  if (is === '[object Object]') {
    let res = {};
    for (let key in arg) {
      if (fn(arg[key], key)) {
        res[key] = arg[key];
      }
    }

    return res;
  }

  if (is === '[object Promise]') {
    return arg.then(val => (fn(val) ? val : Promise.reject(val)));
  }
}

function reduce(fn, init, arg) {
  if (arg == null) {
    return arg;
  }

  if (typeof arg.reduce === 'function') {
    return arg.reduce(fn, init);
  }

  let is = what_is(arg);

  if (is === '[object Object]') {
    let state = init;
    for (let key in arg) {
      state = fn(state, arg[key], key, arg);
    }

    return state;
  }
}

function shallow_copy(arg) {
  return map(identity, arg);
}

function path(keys, obj) {
  if (typeof keys == 'string') {
    keys = keys.split('.');
  }

  let result = obj;
  let idx = 0;
  while (idx < keys.length) {
    if ((result == null) | (result == undefined)) {
      return;
    }
    result = result[keys[idx]];
    idx += 1;
  }

  return result;
}

function get_or(fallback, keys, obj) {
  let result = path(keys, obj);
  return is_nil(result) ? fallback : result;
}

function bind(fn, ...args) {
  return fn.bind(fn, ...args);
}

module.exports = {
  identity,
  is_nil,
  is_empty,
  what_is,
  map,
  filter,
  reduce,
  shallow_copy,
  get_or,
  bind
};
