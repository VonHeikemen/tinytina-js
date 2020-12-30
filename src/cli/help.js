module.exports = function help() {
  return `tinytina - Command-line http client.

  Put your request parameters in a json file (a collection), make a query and run them.

  USAGE
      tinytina --help
      tinytina --version
      tinytina list [arg]
      tinytina [OPTIONS] init filepath
      tinytina [OPTIONS] run [<collection-id>:<request-id> ...]
      tinytina [OPTIONS] run-all 
      tinytina [OPTIONS] convert-to command-name [<collection-id>:<request-id> ...]
      tinytina [OPTIONS] markdown
      tinytina [OPTIONS] use-script script-path [args]

  COMMANDS
      init:
          Generate a json schema and writes to the given filepath. If the file exists it would abort 
          the process. Use the --force option to overwrite the file if it exists.

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
          Show the json schema as a markdown document. Use the option '--example-syntax' to choose the syntax of
          the commands shown as examples and '--arg-separator' to choose the arguments delimeter. 

      use-script:
          It takes a javascript file that exposes a function through 'module.exports' and executes that function.
          For further information see the ADVANCE USAGE section.

  OPTIONS
      -h, --help                          Shows this help message
      -v, --version                       Displays the current version of tinytina
      --debug                             Show debugging information
      -s, --schema                        Path to the json file containing the collection
      -e, --env                           Specifies the set of variables that can be used in a collection
      -g, --global <name>:<value>         Set an environment variable from the command-line
      -H, --hide                          It prevents from showing the environment variable in interactive mode
      -i, --interactive                   It presents a "form" with the requests params before running it
      -p, --request-prop                  Change the search criteria ("id" by default) to another property
      -r, --raw-response                  Disable the colors and format of the response body
      -f, --force                         In the 'init' command, try to write a file even if it already exist
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
              - data-description: In the case where data is an object you can use this property to store the "metadata"
                of the key-value pairs
              - files: A list of files to be uploaded.
              - "headers", "query" and "files" must be arrays of objects, 
                 these objects must have "name" and "value" properties.
                 Additionaly they can have a "metadata" property which 
                 should be and object that stores additional data that 
                 will be use by the 'markdown' command to display a table.

  ADVANCE USAGE
      This feature assumes you have knowledge of javascript, that is because if you ever do need to use it then you
      should be using another tool. But in the odd case you still want to use tinytina, we got your back.

      To give the user the ability to apply any kind of logic to the execution of the requests tinytina exposes a 
      command called 'use-script', with it you can use a script with valid javascript syntax to run the requests in
      any way you see fit. The following will be an example of the minimal amount of code you'll need to run a request.

      \`\`\`
      const { http, json, argv } = global.tinytina;
      const [query] = argv;

      module.exports = async function() {
        await http.send(query).then(json.print);
      };
      \`\`\`

    This is how you would use it in the command line.

    tinytina --schema ./schema.json -env dev use-script ./path-to-script.js collection-id:request-id

    The 'global.tinytina' object within the script has the following properties.
 
      - argv
        An array containing the rest of the parameters after the script's path
      - print
        A function that can "pretty print" any text you pass to it.
      - env
        An object that contains the information about the current environment variables
        - name
          The name of the environment
        - data
          The variables available to the requests
      - json
        - parse
          A function that will try to convert a text into a json object and return the result.
          If it fails, it returns the original text.
        - print
          A function that will first try to convert a plain text into a json object, if it is a valid json 
          string it will print it to the screen, if it fails it will print the text.
        - readfile
          A function that can process a valid .json file. The process in handled by the 'jsonfile' package.
          Find out more about it here: https://www.npmjs.com/package/jsonfile
        - writefile
          A function that write a valid json file in the filesystem. The process in handled by the 'jsonfile' package.
      - http
        An object with utility functions that will help you run the requests
        - get_data
          A function that takes a query and gives you back an object that contains all 
          the data that will be send in the request.
        - fetch
          A function, the http client that executes the request. 
          Find out more about it here: https://www.npmjs.com/package/node-fetch
        - run
          A function that uses 'fetch' to send a request, it takes two parameters:
            1. The query of the request you want to run
            2. a data object that can replace the original data of the request
            This object can be anything that the package 'mergerino' can handle.
            Find out more about it here: https://www.npmjs.com/package/mergerino
        - send
          A function that uses 'run' to send a request and gives you back the body of the response as text.
          It takes the same parameters as 'run'.
        - json
          A function that uses 'run' to send a request and gives you back the body of the response as a json object.
          It takes the same parameters as 'run'.
      - FormData
        A constructor that creates "multipart/form-data" streams. This is handled by the package form-data.
        Find out more about it here: https://www.npmjs.com/package/form-data
      - suite
        A function that creates a "test suite". This test suite in handled by the package 'baretest'
        Find out more about it here: https://www.npmjs.com/package/baretest

  EXAMPLES
      Assuming "tinytina" is an executable already in your PATH.

      Create a schema file:
          tinytina init ./path-to-schema.json

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
          tinytina --schema ./example.json --arg-separator \$'\\n' convert-to curl auth:login,logout

      Render the schema as markdown document:
          tinytina --schema ./example.json --env dev markdown

      Exclude the collection 'user' and the request 'login' from the markdown:
          tinytina --schema ./example.json --exclude "user auth:login" markdown

      Choose a httpie as syntax for the commands shown in the markdown document (bash):
          tinytina --schema ./example.json --example-syntax httpie --arg-separator \$' \\\\\\n' markdown

      Use a script to execute the http requests on the schema:
          tinytina --schema ./example.json --env dev use-script ./script.js
`;
};
