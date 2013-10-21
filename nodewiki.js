#!/usr/bin/env node

var fs = require("fs");
var http = require("http");
var path = require("path");
var connect = require("connect");
var socketio = require("socket.io");
var mod_getopt = require('posix-getopt');
var mdserver = require("./lib/mdserver");
var getDir = require("./lib/getDir");

// Defaults
var portNumberDefault = process.env.PORT || 8888;
var listenAddr = process.env.NW_ADDR || "";    // "" ==> INADDR_ANY
exports.gitMode = false;  // exported for lib/mdserver.js

var portNumber = portNumberDefault;

// Process command line
var parser, option;
parser = new mod_getopt.BasicParser('a:(addr)g(git)h(help)l(local)p:(port)u', process.argv);

while ((option = parser.getopt()) !== undefined) {

  switch (option.option) {

  case 'a':
    listenAddr = option.optarg;
    break;

  case 'g':
    if (fs.existsSync && fs.existsSync(process.cwd() + '/.git')){
      exports.gitMode = true;
    } else if (!fs.existsSync) {
      console.log('ERROR: You are using an outdated version of nodejs\n');
      process.exit(1);
    } else {
      console.log(
        'ERROR: No git repository found\n',
        '\'--git\' requires a git repository in the current directory.\n',
        'Type "git init" to create one.');
      process.exit(1);
    }
    break;

  case 'h':
    showHelp();
    process.exit(0);
    break;

  case 'l':
    listenAddr = "localhost";
    break;

  case 'p':
    var argPort = parseInt(option.optarg);
    if (typeof argPort == 'number' && argPort > 0){
      portNumber = argPort;
    } else {
      console.log('ERROR: %s is not a valid port number.\n', option.optarg);
      process.exit(1);
    }
    break;

  case 'u':
    // note: this means that the option u must come after option g
    if (exports.gitMode) {
      exports.gitAutoPush = true;
    }
    break;

  default:
    /* error message already emitted by getopt() */
    console.assert('?' == option.option);
    showUsage();
    process.exit(1);
    break;
  }
}

function showHelp(){
  console.log('Node Wiki', '\n---------');
  showUsage();
}

function showUsage() {
  console.log(
    'usage: nodewiki [--addr=<addr> | --local] [--git] [--help] [--port=<portnumber>]\n',
    '  -a | --addr   IPv4 listen address (default = any)\n',
    '  -g | --git    Commit each save to a git repository\n',
    '  -u            Push each commit made to remote\n',
    '  -h | --help   Print this message\n',
    '  -l | --local  Listen on "localhost" (127.0.0.1) only.\n',
    '  -p | --port   Use the specified port'
    );
}

// end of command line processing

var app = connect();
app.use(connect.logger('dev'));
app.use(connect.static(__dirname + '/static'));

app.use('/', function(req, res){
  res.end(fs.readFileSync(__dirname + '/static/index.html', 'utf-8'));
});

var server = http.createServer(app);
server.listen(portNumber, listenAddr);
io = socketio.listen(server);
io.set('log level', 2);

io.sockets.on('connection', function (socket){
  var path = process.cwd() + '/';
  getDir.getDir(path, function (files) {
    // send the list of files
    socket.emit('files', files);

    // now load up more details on the files
    // getDir

    // open a file
    socket.on('open', function (file) {
      console.log('open received - ' + file.name);
      mdserver.sendFile(file, path, socket);
    });

    // open a folder
    socket.on('dir', function (folder) {
      console.log('ls received - ' + folder.name);
      var currentPath = path + folder.name;

      getDir.getDir(currentPath, function (files) {
        socket.emit('dirReply', {path: currentPath, files: files});
      });
    });

    socket.on('disconnect', function(){
      // if a user disconnects, reinitialise variables
      // var path = process.cwd() + '/';
      // refreshDir(function(){
      //   var links = getDir.parseLinks(dir);
      //   var directoryDepth = 0;
      // });
    });

    socket.on('saveFile', function (file){
      console.log('saveFile recieved, name: ' + file.name);
      mdserver.saveFile(file, currentPath, socket);
    });

    socket.on('mkdir', function (folderName) {
      fs.mkdir(path + folderName, 0777, function(err){
        if (err) {
          socket.emit('mkdirReply', err);
        } else {
          // refreshNavLinks();
        }
      });
    });
  });
});
if (exports.gitMode == true) {
  console.log('Using git mode.');
}
if (listenAddr != "") {
  console.log("server started, addr:port = %s:%s", listenAddr, portNumber);
} else {
  console.log("server started, port = " + portNumber);
}
