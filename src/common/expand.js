const create_expand = require('expand-template');

module.exports = function (opts) {
  const expand = create_expand(opts);

  return function _expand(env, template) {
    if (arguments.length === 1) {
      return (tmpl) => _expand(env, tmpl);
    }

    const is = Object.prototype.toString.call(template);

    if (is == '[object String]') {
      return expand(template, env);
    }

    if (is == '[object Array]') {
      return template.map(_expand(env));
    }

    if (is == '[object Object]') {
      let res = {};
      for (let key in template) {
        res[key] = _expand(env, template[key]);
      }

      return res;
    }

    return template;
  };
};
