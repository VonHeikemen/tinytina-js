module.exports = function help() {
  return `tinytina - Command-line http client.

  Put your request parameters in a json file (a collection), make a query and run them.

  USAGE
      tinytina --help
      tinytina --version
      tinytina [OPTIONS] run [<collection-id>:<request-id> ...]
      tinytina [OPTIONS] run-all 

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
              - description: What the requests does
              - url: The route you want to "visit" 
              - method: The http method
              - headers: The http headers. 
              - query: Params to be used as a query string.
              - data: Params to be used in a POST request
              - files: A list of files to be uploaded
              - "headers", "query", "data" and "files" must be arrays of objects, 
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

      Hide an environment variables in interactive mode
          tinytina --schema ./example.json --hide password --hide token --interactive run auth:login

      Running multiple requests of the same collection
          tinytina --schema ./example.json run auth:login,logout

      Running multiple requests of different collections
          tinytina --schema ./example.json run auth:login user:get-posts
      
      Running all requests in a schema
          tinytina --schema ./example.json run-all
`;
};
