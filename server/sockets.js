
sio = require('socket.io'),
	game = require('./game');

var io, interval;

exports.config = {
	frameRate: 60
};

var connect = function(socket){

	socket.on('join', function(){
		//add player
		game.addPlayer(socket.id);
		socket.emit('id', socket.id);
	});

	socket.on('getparams', function(data, res){
		res(game.getParams());
	});

	socket.on('setparams', function(data){
		game.setParams(data);
	});

	socket.on('disconnect', function(data){
		game.removePlayer(socket.id);
	});

	//player action
	socket.on('action', function(data){
		game.action(socket.id, data);
	});

};

var runLoop = function(){
	var data = game.loop();
	io.sockets.emit('update', data);
}

exports.listen = function(server){
	io = sio.listen(server, {log: false});
	io.sockets.on('connection', connect);
	interval = setInterval(runLoop, 1000/exports.config.frameRate);
	game.ready(io);
}