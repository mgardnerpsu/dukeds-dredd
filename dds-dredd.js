var Dredd = require('dredd');

configuration = {
  server: process.env.DUKEDS_API_SERVER, // your URL to API endpoint the tests will run against
  options: {

    'path': ['../duke-data-service/apiary.apib'],  // Required Array if Strings; filepaths to API Blueprint files, can use glob wildcards

    'dry-run': false, // Boolean, do not run any real HTTP transaction
    'names': false,   // Boolean, Print Transaction names and finish, similar to dry-run

    'level': 'info', // String, log-level (info, silly, debug, verbose, ...)
    'silent': false, // Boolean, Silences all logging output

    'only': [], // Array of Strings, run only transaction that match these names

    'header': ['Accept: application/json', 'Authorization: '.concat(process.env.DUKEDS_API_KEY)], // Array of Strings, these strings are then added as headers (key:value) to every transaction
    'user': null,    // String, Basic Auth credentials in the form username:password

    'hookfiles': ['./hooks.js'], // Array of Strings, filepaths to files containing hooks (can use glob wildcards)

    'reporter': [], // Array of possible reporters, see folder src/reporters

    'output': [],    // Array of Strings, filepaths to files used for output of file-based reporters

    'inline-errors': false, // Boolean, If failures/errors are display immediately in Dredd run

    'color': true,
    'timestamp': false
  }
  // 'emitter': EventEmitterInstance // optional - listen to test progress, your own instance of EventEmitter

  // 'hooksData': {
  //   'pathToHook' : '...'
  // }

  // 'data': {
  //   'path/to/file': '...'
  //}
}

var dredd = new Dredd(configuration);

dredd.run(function (err, stats) {
  // err is present if anything went wrong
  // otherwise stats is an object with useful statistics
});
