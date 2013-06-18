
var socket = io.connect(window.location.href);

var Comm = {};
var allData = {};

var notify = function(msg){
	notifyEl.innerHTML = msg;
}

Comm.submitAction = function(data){
	socket.emit('action', data);
}

socket.on('alert', function(data){
	
});

socket.on('update', function(data){
	allData = data;
})

socket.on('id', function(id){
	
});

window.onbeforeunload = function (e) {
 	socket.disconnect();
};

