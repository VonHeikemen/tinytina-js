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
  const is = Object.prototype.toString.call(arg);

  return {
    val: () => is,
    object: () => is == '[object Object]',
    array: () => is == '[object Array]',
    promise: () => is == '[object Promise]',
    undefined: () => is == '[object Undefined]',
    null: () => is == '[object Null]',
    number: () => is == '[object Number]',
    func: () => is == '[object Function]',
  };
}

function map(fn, arg) {
  if (arg == null) {
    return arg;
  }

  if (typeof arg.map === 'function') {
    return arg.map(fn);
  }

  let is = what_is(arg);

  if (is.object()) {
    let res = {};
    for (let key in arg) {
      res[key] = fn(arg[key], key);
    }

    return res;
  }

  if (is.promise()) {
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

  if (is.object()) {
    let res = {};
    for (let key in arg) {
      if (fn(arg[key], key)) {
        res[key] = arg[key];
      }
    }

    return res;
  }

  if (is.promise()) {
    return arg.then((val) => (fn(val) ? val : Promise.reject(val)));
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

  if (is.object()) {
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

function reject(arg) {
  return Promise.reject(arg);
}

function resolved(arg) {
  return Promise.resolve(arg);
}

function then(fn) {
  return (promise) => promise.then(fn);
}

function pcatch(fn) {
  return (promise) => promise.catch(fn);
}

function promise_all(arr) {
  return Promise.all(arr);
}

function pipe() {
  let fns = arguments;

  return function _pipe() {
    let acc = fns[0].apply(this, arguments);

    for (var i = 1; i < fns.length; i++) {
      acc = fns[i](acc);
    }

    return acc;
  };
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
  bind,
  reject,
  resolved,
  then,
  pcatch,
  promise_all,
  pipe,
};
