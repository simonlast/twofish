
var socket = io.connect('localhost');

var Comm = {};
var allData = {};

Comm.getParams = function(){
	socket.emit('getparams', '', function(params){
		Comm.params = params;
		Dash.create();
	})
}


socket.on('update', function(data){
	allData = data;
});

window.onbeforeunload = function (e) {
 	socket.disconnect();
};

Comm.getParams();
