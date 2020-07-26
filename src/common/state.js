const init_state = () => ({
  env: {},
  hidden_env_vars: [],
  collection: [],
});

function create_env(env_name, state) {
  let state_env = state.raw[env_name] ? state.raw[env_name] : {};
  return Object.assign({}, state.global, state_env, state.extra);
}

module.exports = {
  init_state,
  create_env,
};
