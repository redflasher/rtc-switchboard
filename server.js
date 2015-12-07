var server = require('http').createServer();
var switchboard = require('./')(server, { servelib: true });
var port = parseInt(process.env.NODE_PORT || process.env.PORT || process.argv[2], 10) || 3000;
// var replify = require('replify');

/*server.on('request', function(req, res) {
  if (req.url === '/') {
    res.writeHead(302, {
      'Location': 'https://github.com/rtc-io/rtc-switchboard'
    });
    res.end('switchboard available from: https://github.com/rtc-io/rtc-switchboard');
  }
});*/


/****/
var express = require('express');
var app = express();

app.get('/', function (req, res) {
  // res.send('Hello World!');
  console.log("__dirname: "+ __dirname);
  res.sendFile(__dirname+"/html/examples/index.html");
});

app.use(express.static(__dirname + '/html/examples/css'));
app.use(express.static(__dirname + '/html/examples/images'));
app.use(express.static(__dirname + '/html/examples/js'));
app.use(express.static(__dirname + '/html/examples/'));

var server = app.listen(port, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);

});
/*  */

// start the server
server.listen(port, function(err) {
  if (err) {
    return console.log('Encountered error starting server: ', err);
  }

  console.log('server running at http://localhost:' + port + '/');
});

// // add the repl
// replify({
//   name: 'switchboard',
//   app: switchboard,
//   contexts: {
//     server: server
//   }
// });
//
// switchboard.on('room:create', function(room) {
//   console.log('room ' + room + ' created, now have ' + switchboard.rooms.length + ' active rooms');
// });
//
// switchboard.on('room:destroy', function(room) {
//   console.log('room ' + room + ' destroyed, ' + switchboard.rooms.length + ' active rooms remain');
//
//   if (typeof gc == 'function') {
//     console.log('gc');
//     gc();
//   }
// });
