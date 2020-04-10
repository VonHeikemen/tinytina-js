# Tinytina

Is a command-line utility that reads data from a json file and feeds it to an http client. Is like the mix of `curl` and `postman` that nobody asked for.

## Getting started

To run Tinytina, ensure that you have Node.js >= v11. [Install Node.js via package manager](https://nodejs.org/en/download/package-manager/).

### Installation

You can do it in different ways.

#### Download minified script

Go to the [release page](https://github.com/VonHeikemen/tinytina-js/releases), download tinytina.zip and extract the minified version with all the dependencies included. Now you can use it directly with `node` or make it executable or create an alias, whatever your heart desires.

#### Using the npm install command

As of version 0.1.1 you can use npm to install from the repository. This way you can have the `tinytina` command available.

Fetch from master.

```
npm install --global github:VonHeikemen/tinytina-js
```

Or install it from one of the available [tags](https://github.com/VonHeikemen/tinytina-js/tags). 

```
npm install --global github:VonHeikemen/tinytina-js#<tag>
```

#### Install from source

Clone/download the repository and install the dependencies yourself.

```
 git clone https://github.com/VonHeikemen/tinytina-js 
 cd tinytina-js
 npm install
 npm run test
```

## Usage

### Using the CLI

#### `tinytina [OPTIONS] run <collection-id>:<request-id> ...`
The `run` command is used to query the json schema for a one or more requests to execute. This command has a limited interactive mode that you can use to inspect the data before you send it.

It takes a list of "queries" that represent the path to the request in the schema. The query is made of two parts separated by `:`, the first part is the collection id and the other is a comma separated list of request id (or whatever you set with --request-prop)

#### `tinytina [OPTIONS] run-all`
Executes every requests in the json schema.

#### `tinytina [OPTIONS] list [arg]`
It shows a list with the metadata of the requests in the schema. If 'path' is provided as a first argument it will show a list of valid path that you can use with the `run` command.

#### `tinytina [OPTIONS] convert-to command-name [<collection-id>:<request-id> ...]`
It transforms a request query or a list of queries into a shell commands and prints it to the screen. Currently supports "curl", "httpie" and "wget" commands.

#### `tinytina [OPTIONS] markdown`
Shows the json schema as a markdown document. Use the option '--example-syntax' to choose the commands shown as examples and '--arg-separator' to choose the arguments delimeter.

### Command Line Options
- `-h`, `--help`<br/>
  Shows usage information.

- `-v`, `--version`<br/>
  Displays the current version of tinytina.

- `--debug`<br/>
  Show debugging information.

- `-s`, `--schema`<br/>
  Path to the json file containing the collection.

- `-e`, `--env`<br/>
  Specifies the set of variables that can be used in a collection.

- `-g`, `--global` `<name>:<value>` <br/>
  Set an environment variable from the command-line.

- `-hi`, `--hide`<br/>
  It prevents from showing the environment variable in interactive mode.

- `-i`, `--interactive`<br/>
  It presents a "form" with the requests params before running it.

- `-p`, `--request-prop`<br/>
  Change the search criteria ("id" by default) to another property.

- `-r`, `--raw-response`<br/>
  Disable the colors and format of the response body.

- `--arg-separator`<br />
Set the delimeter between arguments in the commands shown by 'convert-to.'

- `--example-syntax`<br />
Set the example commands shown by the 'markdown' command.

- `--exclude`<br />
Exclude a collection or a request shown by the 'markdown' command.

### Examples
Assuming you downloaded the release version and made it executable with the name tinytina.

Running a single request:
```
 tinytina --schema ./example.json run auth:login
```

Running request with the "dev" environment:
```
 tinytina --schema ./example.json --env dev run auth:login
```

Setting an environment variable (apikey) from the command line
```
 tinytina --schema ./example.json --global "apikey:super-secret" run auth:login
```

Running a request in interactive mode:
```
 tinytina --schema ./example.json --interactive run auth:login
```

Hide an environment variables in interactive mode
```
 tinytina --schema ./example.json --hide password --hide token --interactive run auth:login
```

Running multiple requests of the same collection
```
 tinytina --schema ./example.json run auth:login,logout
```

Running multiple requests of different collections
```
 tinytina --schema ./example.json run auth:login user:get-posts
```

Running all requests in a schema
```
 tinytina --schema ./example.json run-all
```

List the data of all the requests in the schema
```
 tinytina --schema ./example.json list
```

List only the paths to the requests in the schema
```
 tinytina --schema ./example.json list path
```
Show a request as a curl command
```
 tinytina --schema ./example.json convert-to curl auth:login
```

Show multiple requests as curl commands and change the argument delimeter to a newline (bash):
```
 tinytina --schema ./example.json --arg-separator $'\n' convert-to curl auth:login,logout
```

Render the schema as markdown document:
```
tinytina --schema ./example.json --env dev markdown
```

Exclude the collection 'user' and the request 'login' from the markdown:
```
tinytina --schema ./example.json --exclude "user auth:login" markdown
```

Choose a httpie as syntax for the commands shown in the markdown document (bash):
```
tinytina --schema ./example.json --example-syntax httpie --arg-separator $' \\\n' markdown
```

### JSON Schema Structure
A schema is a json file that contains all the data necesary to execute a request as well information about the context or environment available. It looks like this [one](https://github.com/VonHeikemen/tinytina-js/tree/master/tests/schemas/fixtures/tinytina-schema.json).

#### Top Level Properties
| Property     | Description   |
|--------------|---------------|
| `globals`    | An object containing a set of variables that can be used anywhere else in the collection. It can be a user name, a url, a common id for testing. |
| `envs`       | An object. Each key will be considered an environment (like globals) that will complement the globals. This can be use to store context dependent variables like a host. |
| `hide`       | An array. A list of variables in the environment that you want to hide in interactive mode. |
| `collections`| An array of collection objects. |

#### Collection Object
| Property      | Description   |
|---------------|---------------|
| `id`          | A short string to identify the collection. |
| `name`        | A proper name for the collection. |
| `description` | What the collection contains. |
| `requests`    | An array of requests objects. |
| `collections` | An array of collection objects. |

#### Request Object
| Property           | Description   |
|--------------------|---------------|
| `id`               | A short string to identify the request. |
| `name`             | A proper name for the requests. |
| `description`      | What the requests does. |
| `url`              | The route you want to "visit." |
| `method`           | The http method | 
| `type`             | It can be `json`, `urlencoded` or `form`. This is used when the method is not GET. |
| `output`           | When present it will try to download the response to a file. It should be an object with the properties "path" and "filename". If "filename" is omitted it will try to guess the name from the response headers. |
| `headers`          | The http headers. |
| `query`            | Params to be used as a query string. |
| `data`             | Params to be used in a POST request. It can be an array of objects with the properties "name" and "value" or a json object. If it is a json object it will be converted to a string and the header 'Content-type' will be set to 'application/json.'|
| `data-description` | In the case where `data` is an object you can use this property to store the "metadata" of the key-value pairs |
| `files`            | A list of files to be uploaded. |

#### Parameters
Properties like "headers", "query", "data" and "files" can be arrays of objects that must have "name" and "value" properties, additionally they can have a "metadata" property which should be an object that holds addiotional data about the parameter, like a description or a type, this object will be used by the 'markdown' command to show the data in a table where the keys become headers and the values columns.

#### Environment variables
Inside a request object you can use placeholders for a piece of data that can change depending on the context. They can be used in the following properties `url`, `output`, `headers`, `query`, `data` and `files`.

For example, you can have a "host" variable that has the value `http://localhost:3000` in development and for testing you use `http://example.com`, you can write your URLs like this `{host}/api/method`. Another common thing is to use a token in a authorization header, instead of writing into the schema you can add your token with the `--global` option (`--global "token:some-token"`) and use it in your header like this `{ "name": "Authorization", "value": "{token}" }`.

### Advance usage
This feature assumes you have knowledge of javascript, that is because if you ever do need to use it then you should be using another tool. But in the odd case you still want to use tinytina, we got your back.

To give the user the ability to apply any kind of logic to the execution of the requests tinytina exposes a command called `test-script`, with it you can use a script with valid javascript syntax to run the requests in any way you see fit. The following will be an example of the minimal amount of code you'll need to run a request.

```js
const { http, json, argv } = global.tinytina;
const [query] = argv;

module.exports = async function() {
  await http.send(query).then(json.print);
};
```

This is how you would use it in the command line.

```
tinytina --schema ./schema.json -env dev test-script ./path-to-script.js collection-id:request-id
```

The `global.tinytina` object within the script has the following properties.

| Property           | Description   |
|--------------------|---------------|
|`argv`              | An array containing the rest of the parameters after the script's path. |
|`print`             | A function that can "pretty print" any text you pass to it. |
|`env`               | An object that contains the information about the current environment variables. |
|`env.name`          | The name of the environment. |
|`env.data`          | The variables available to the requests |
|`json`              | An object with utility functions |
|`json.parse`        | A function that will try to convert a text into a json object and return the result. If it fails, it returns the original text. |
|`json.print`        | A function that will first try to convert a plain text into a json object, if it is a valid json string it will print it to the screen, if it fails it will print the text. |
|`json.readfile`     | A function that can process a valid .json file. The process in handled by the [jsonfile](https://www.npmjs.com/package/jsonfile) package. |
|`json.writefile`    | A function that write a valid json file in the filesystem. The process in handled by the [jsonfile](https://www.npmjs.com/package/jsonfile) package. |
|`http`              | An object with utility functions that will help you run the requests. |
|`http.get_data`     | A function that takes a query and gives you back an object that contains all the data that will be send in the request. |
|`http.fetch`        | A function, the http client that executes the request. Find out more about it here: [node-fetch](https://www.npmjs.com/package/node-fetch). |
|`http.run`          | A function that uses `fetch` to send a request, it takes two parameters: 1. The query of the request you want to run 2. a data object that can replace the original data of the request. This object can be anything that the package '[mergerino](https://www.npmjs.com/package/mergerino)' can handle. |
|`http.send`         | A function that uses `http.run` to send a request and gives you back the body of the response as text. It takes the same parameters as `http.run`. |
|`http.json`         | A function that uses `http.run` to send a request and gives you back the body of the response as a json object. It takes the same parameters as `http.run`. |
|`suite`             | A function that creates a "test suite". This test suite in handled by the package [baretest](https://www.npmjs.com/package/baretest). |

