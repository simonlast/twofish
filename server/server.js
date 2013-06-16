
var http = require('http'),
	connect = require('connect'),
	express = require('express'),
	sockets = require('./sockets');

var app = express();

var oneDay = 86400000;

app.use(
  connect.static(__dirname + '/../public', { maxAge: oneDay })
);

var server = http.createServer(app);

sockets.listen(server);

server.listen(80);