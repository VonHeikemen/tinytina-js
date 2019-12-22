const tinytina = require('../schemas/tinytina');

function create_reader(schema_type) {
  switch (schema_type) {
    case 'tinytina':
      return tinytina;
  }

  return tinytina;
}

module.exports = {
  create_reader
};
