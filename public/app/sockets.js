
var socket = io.connect(window.location.href);

var Comm = {};
var gameData = {};

var predatorEl = document.getElementById('predator-count');
var preyEl = document.getElementById('prey-count');
var notifyEl = document.getElementById('notification');

var notify = function(msg){
	notifyEl.innerHTML = msg;
}

Comm.submitAction = function(data){
	socket.emit('action', data);
}

socket.on('alert', function(data){
	notify(data);
});

socket.on('update', function(data){
	gameData = data;
	pjs.joinData();
})

socket.on('id', function(id){
	Comm.id = id;
 	pjs.setPlayerId(id);
});

