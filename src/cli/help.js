module.exports = function help() {
  return `tinytina - Command-line http client.

  Put your request parameters in a json file (a collection), make a query and run them.

  USAGE
      tinytina --help
      tinytina --version
      tinytina list [arg]
      tinytina [OPTIONS] run [<collection-id>:<request-id> ...]
      tinytina [OPTIONS] run-all 
      tinytina [OPTIONS] convert-to command-name [<collection-id>:<request-id> ...]
      tinytina [OPTIONS] markdown

  COMMANDS
      run:
          Use it to query the json schema and execute a one or more requests. The query is made of two parts
          separated by ':', the first part is the collection id and the other is a comma separated list of 
          request id (or whatever you set with --request-prop)

      run-all:
          Executes every requests in the json schema.
      
      list:
          It shows a list with the metadata of the requests in the schema. If 'path' is provided as a first 
          argument it will show a list of valid path that you can use with the run command.

      convert-to:
          It transforms a request query or a list of queries into a shell commands and prints it to the screen. 
          Currently supports "curl", "httpie" and "wget" commands.

      markdown, md:
          Transforms the json schema into a markdown document. Use the option '--example-syntax' to choose the commands
          shown as examples and '--arg-separator' to choose the arguments delimeter. 
          

  OPTIONS
      -h, --help                          Shows this help message
      -v, --version                       Displays the current version of tinytina
      --debug                             Show debugging information
      -s, --schema                        Path to the json file containing the collection
      -e, --env                           Specifies the set of variables that can be used in a collection
      -g, --global <name>:<value>         Set an environment variable from the command-line
      -hi, --hide                         It prevents from showing the environment variable in interactive mode
      -i, --interactive                   It presents a "form" with the requests params before running it
      -p, --request-prop                  Change the search criteria ("id" by default) to another property
      -r, --raw-response                  Disable the colors and format of the response body
      --arg-separator                     Set the delimeter of the shell commands in 'convert-to' and 'markdown'
      --example-syntax                    Set the example commands shown by the 'markdown' command
      --exclude                           Exclude a collection or a request shown by the 'markdown' command

  SCHEMA STRUCTURE
      A schema is a json file that contains all the data necesary to execute a request as well information about
      the context or environment available. It should have the following.

          - globals
          An object containing a set of variables that can be used in anywhere else in the collection.
          A quick example can be a user name, a url, a common id for testing.

          - envs
          An object. Each key will be considered an environment (like globals) that will complement the globals.
          This can be use to store context dependent variables like a host.

          - hide
          An array. A list of variables in the environment that you want to hide in interactive mode. 

          - collections
          An array of collection objects.

          - collection object
          An object with the keys
              - id: A short string to identify the collection.
              - name: A proper name for the collection.
              - description: What the collection contains.
              - requests: An array of requests objects.
              - collections": An array of collection objects.

          - request object
            An object with the keys
              - id: A short string to identify the request.
              - name: A proper name for the request.
              - description: What the requests does.
              - url: The route you want to "visit."
              - method: The http method.
              - type: type of POST request. It can be "urlencoded", "form" or "json".
              - output: When present it will try to download the response to a file. It should be an object with the
                properties "path" and "filename". If "filename" is omitted it will try to guess the name 
                from the response headers.
              - headers: The http headers. 
              - query: Params to be used as a query string.
              - data: Params to be used in a POST request. It can be an array of objects with the 
                properties "name" and "value" or a json object. If it is a json object it will be converted to a string
                and the header 'Content-type' will be set to 'application/json.'
              - files: A list of files to be uploaded.
              - "headers", "query" and "files" must be arrays of objects, 
                 these objects must have "name" and "value" properties

  EXAMPLES
      Assuming "tinytina" is an executable already in your PATH.

      Running a single request:
          tinytina --schema ./example.json run auth:login

      Running request with the "dev" environment:
          tinytina --schema ./example.json --env dev run auth:login

      Setting an environment variable (apikey) from the command line
          tinytina --schema ./example.json --global "apikey:super-secret"

      Running a request in interactive mode:
          tinytina --schema ./example.json --interactive run auth:login

      Hide an environment variables in interactive mode:
          tinytina --schema ./example.json --hide password --hide token --interactive run auth:login

      Running multiple requests of the same collection:
          tinytina --schema ./example.json run auth:login,logout

      Running multiple requests of different collections:
          tinytina --schema ./example.json run auth:login user:get-posts

      Running all requests in a schema:
          tinytina --schema ./example.json run-all

      List the data of all the requests in the schema:
          tinytina --schema ./example.json list

      List only the paths to the requests in the schema:
          tinytina --schema ./example.json list path

      Show a request as a curl command:
          tinytina --schema ./example.json convert-to curl auth:login

      Show multiple requests as curl commands and change argument delimeter to a newline (bash):
          tinytina --schema ./example.json --arg-separator $'\n' convert-to curl auth:login,logout

      Render the schema as markdown document:
          tinytina --schema ./example.json --env dev markdown

      Exclude the collection 'user' and the request 'login' from the markdown:
          tinytina --schema ./example.json --exclude "user auth:login" markdown

      Choose a httpie as syntax for the commands shown in the markdown document (bash):
          tinytina --schema ./example.json --example-syntax httpie --arg-separator $' \\\n' markdown
`;
};
