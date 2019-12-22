const env = {
  'api-key': '123',
  'secret-thing': 'no-one-should-see-me',
  name: 'some',
  lastname: 'body',
  fullname: 'some body',
  email: 'not-real-deal',
  host: 'http://localhost:3000',
  'real-email': 'the-real-deal-in-dev',
  'test-email': 'not-real-deal'
};

const fetch_options = {
  opts: { headers: { Authorization: '456' }, method: 'POST' },
  url: 'http://localhost:3000/service/register',
  query: { stuff: 'this goes in the URL as a querystring' },
  body: {
    name: 'some test value',
    lastname: 'body-ish',
    email: 'not-real-deal',
    code: 'no-one-should-see-me'
  },
  files: { image: '/tmp/yourface.jpg' },
  type: 'form'
};

const prompt_options = {
  name: 'request',
  message: 'What the thing does',
  choices: [
    {
      name: '_',
      message: 'Env',
      initial: 'development ✖',
      disabled: '  '
    },
    {
      name: 'url',
      message: 'URL',
      initial: 'http://localhost:3000/service/register'
    },
    { name: 'method', message: 'Method', initial: 'POST' },
    { name: '_', message: '  ', role: 'separator', initial: '  ' },
    { name: '_', message: 'Headers', role: 'separator', initial: '  ' },
    { name: '_', role: 'separator', initial: '  ' },
    {
      name: 'headers.Authorization',
      message: 'Authorization',
      initial: '{api-key}'
    },
    { name: '_', message: '  ', role: 'separator', initial: '  ' },
    { name: '_', message: 'Query', role: 'separator', initial: '  ' },
    { name: '_', role: 'separator', initial: '  ' },
    {
      name: 'query.stuff',
      message: 'stuff',
      initial: 'this goes in the URL as a querystring'
    },
    { name: '_', message: '  ', role: 'separator', initial: '  ' },
    { name: '_', message: 'Data', role: 'separator', initial: '  ' },
    { name: '_', role: 'separator', initial: '  ' },
    { name: 'data.name', message: 'name', initial: 'some test value' },
    { name: 'data.lastname', message: 'lastname', initial: 'body-ish' },
    { name: 'data.email', message: 'email', initial: 'not-real-deal' },
    {
      name: 'data.code',
      message: 'code',
      initial: 'no-one-should-see-me'
    },
    { name: '_', message: '  ', role: 'separator', initial: '  ' },
    { name: '_', message: 'Files', role: 'separator', initial: '  ' },
    { name: '_', role: 'separator', initial: '  ' },
    {
      name: 'files.image',
      message: 'image',
      initial: '/tmp/yourface.jpg'
    }
  ],
  result: ''
}

module.exports = {
  env,
  fetch_options,
  prompt_options
};
