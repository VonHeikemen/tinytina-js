const schema_request_count = 8;

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
};

const valid_paths = [
  '',
  'short-id:also-short',
  'short-id:json-data',
  'short-id.oh-look:download-face',
  'short-id.oh-look:guess-filename',
  'short-id.oh-look.3rd-level:lonely-get',
  'another:has-id'
];

const curl_commands = [
  [
    'curl --request POST',
    '--header "Authorization: {api-key}"',
    '--form "name=some test value"',
    '--form "lastname=body-ish"',
    '--form "email=not-real-deal"',
    '--form "code=no-one-should-see-me"',
    '--form "image=@/tmp/yourface.jpg"',
    '"http://localhost:3000/service/register?stuff=this+goes+in+the+URL+as+a+querystring"'
  ],
  [
    'curl --request POST',
    '--header "Authorization: {api-key}"',
    '--header "Content-Type: application/json"',
    `--data '{
  "name": "some test value",
  "lastname": "body",
  "email": "not-real-deal",
  "code": {
    "payload": "no-one-should-see-me"
  }
}'`,
    '"http://localhost:3000/service/register?stuff=this+goes+in+the+URL+as+a+querystring"'
  ]
];

const httpie_commands = [
  [
    'http --form POST "http://localhost:3000/service/register"',
    'Authorization:"{api-key}"',
    'stuff=="this goes in the URL as a querystring"',
    'name="some test value"',
    'lastname="body-ish"',
    'email="not-real-deal"',
    'code="no-one-should-see-me"',
    'image@/tmp/yourface.jpg'
  ],
  [
    'http --json POST "http://localhost:3000/service/register"',
    'Authorization:"{api-key}"',
    'stuff=="this goes in the URL as a querystring"',
    'name="some test value"',
    'lastname="body"',
    'email="not-real-deal"',
    `code:='{"payload":"no-one-should-see-me"}'`
  ]
];

const wget_commands = [
  [
    'wget --method POST',
    '--header "Authorization: {api-key}"',
    '--body-data "name=some+test+value&lastname=body-ish&email=not-real-deal&code=no-one-should-see-me"',
    '"http://localhost:3000/service/register?stuff=this+goes+in+the+URL+as+a+querystring"'
  ]
]; 

const markdown = `# Name of the schema

Some multiline description about stuff
Look, another line

things...

## A collection

This is a service collection

### The full name of the thing

What the thing does

#### Headers

|  Field | Value | Type | Required |
| --- | --- | --- | --- |
| Authorization | {api-key} | String | Yes |

#### Query String

|  Field | Value |
| --- | --- |
| stuff | this goes in the URL as a querystring |

#### Data

|  Field | Value | Type | Required | Arbitrary Column |
| --- | --- | --- | --- | --- |
| name | some test value | String | Yes |  |
| lastname | body-ish | String | No |  |
| email | not-real-deal | String | Maybe |  |
| code | no-one-should-see-me | String | Yes | A description of whatever |
| image | /tmp/yourface.jpg |  |  |  |

\`\`\`
curl --request POST
--header "Authorization: {api-key}"
--form "name=some test value"
--form "lastname=body-ish"
--form "email=not-real-deal"
--form "code=no-one-should-see-me"
--form "image=@/tmp/yourface.jpg"
"http://localhost:3000/service/register?stuff=this+goes+in+the+URL+as+a+querystring"
\`\`\`

### json-data
#### Headers

|  Field | Value |
| --- | --- |
| Authorization | {api-key} |

#### Query String

|  Field | Value |
| --- | --- |
| stuff | this goes in the URL as a querystring |

#### Data

|  Field | Value |
| --- | --- |
| name | some name |
| lastname | a last name |
| email | this better be an email |
| code | an object with a secret thing |
| code.payload | the secret thing |

\`\`\`
curl --request POST
--header "Authorization: {api-key}"
--header "Content-Type: application/json"
--data '{
  "name": "some test value",
  "lastname": "body",
  "email": "not-real-deal",
  "code": {
    "payload": "no-one-should-see-me"
  }
}'
"http://localhost:3000/service/register?stuff=this+goes+in+the+URL+as+a+querystring"
\`\`\`

## A nested collection

I hope you see where i'm going with this

### Download a face
#### Query String

|  Field | Value |
| --- | --- |
| other-stuff | no method? Don't worry, this is GET |

\`\`\`
curl --request GET
"http://localhost:3000/service/download?other-stuff=no+method%3F+Don%27t+worry%2C+this+is+GET"
\`\`\`

### guess-filename
\`\`\`
curl --request GET
"http://localhost:3000/service/download"
\`\`\`

## 3rd-level
### deeply nested

A nested request

\`\`\`
curl --request GET
"http://localhost:3000/service/download"
\`\`\`

## another
### don't know why no id
\`\`\`
curl --request GET
"http://example.com?code={api-key}"
\`\`\`

### -
\`\`\`
curl --request GET
"http://not-a-good-idea-but-still-possible.example.com"
\`\`\`

`;

module.exports = {
  env,
  fetch_options,
  prompt_options,
  schema_request_count,
  markdown,
  valid_paths,
  curl_commands,
  httpie_commands,
  wget_commands
};
