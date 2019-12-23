# Tinytina

Is a command-line utility that reads data from a json file and feeds it to an http client. Is like the mix of `curl` and `postman` that nobody ask for.

## Getting started

To run Tinytina, ensure that you have Node.js >= v10. [Install Node.js via package manager](https://nodejs.org/en/download/package-manager/). And for now you have to run `src/main.js` directly with `node`.

### Installation
Right now what you can do is clone/download the repository and install the dependencies yourself. This may change in the future.

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

### Examples
Assuming you somehow bundled project into a single file and make it executable with the name tinytina ([@zeit/ncc](https://github.com/zeit/ncc) can help you with that)

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

### JSON Schema Structure
A schema is a json file that contains all the data necesary to execute a request as well information about the context or environment available. It looks like this [one](https://github.com/VonHeikemen/tinytina-js/tree/master/tests/schemas/fixtures/tinytina-schema.json)

#### Top Level Properties
| Property     | Description   |
|--------------|---------------|
| `globals`    | An object containing a set of variables that can be used in anywhere else in the collection. It can be a user name, a url, a common id for testing. |
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
| Property      | Description   |
|---------------|---------------|
| `id`          | A short string to identify the request. |
| `name`        | A proper name for the requests. |
| `description` | What the requests does. |
| `url`         | The route you want to "visit." |
| `method`      | The http method | 
| `type`        | It can be `json`, `urlencoded` or `form`. This is used when the method is POST. |
| `headers`     | The http headers. |
| `query`       | Params to be used as a query string. |
| `data`        | Params to be used in a POST request. |
| `files`       | A list of files to be uploaded. |
|               | "headers", "query", "data" and "files" must be arrays of objects these objects must have "name" and "value" properties.

