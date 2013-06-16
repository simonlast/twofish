
var prototype = require('prototype'),
	_ = require('underscore');
require('sylvester');

var gameData = {};
var io;

var players = [];

var playerSpeed = 1.2;
var decay = .0005;
var repDecay = .005;
var playerRad = 30;
var algaeRad = 20;
var algaeCount = 0;
var AIcount = 0;


exports.ready = function(sio){

	io = sio;

	for(var i=0; i<3; i++){
		addAlgae();
	}
}

var addAlgae = function(){
	var al = new Algae(Math.random()*400-200, Math.random()*400-200, 'Algae' + algaeCount);
	gameData['Algae' + algaeCount] = al.getObj();
	players.push(al);
	algaeCount++;
}

var notify = function(msg, id){
	if(!io.sockets.sockets[id]){
		delete gameData[id];
		players = players.filter(function(el){
			eturn el.id !== id;
		})
		return;
	}

	io.sockets.sockets[id].emit('alert', msg);
}

var notifyRespawn = function(secs, id){
	var count = (secs)*1000;
	notify('You died.<br />Respawn in ' + (Math.floor(count/1000)) + ' seconds', id);
	var intv = setInterval(function(){
		count -= 1000;

		notify('You died.<br />Respawn in ' + (Math.floor(count/1000)) + ' seconds', id);
		if(count <= 0){
			clearInterval(intv);
			notify('', id);
			exports.addPlayer(id);
		}
	},1000);
};

exports.addPlayer = function(id){
	var newPlayer;
	if(Math.random()<.5){
		newPlayer = new Predator(0,0, id);
	}else{
		newPlayer = new Prey(0,0,id);
	}

	gameData[id] = newPlayer.getObj();

	players.push(newPlayer);

	console.log('addPlayer', gameData);
}

exports.removePlayer = function(id){
	delete gameData[id];
	players = players.filter(function(el){
		return el.id !== id;
	})
	console.log('removePlayer', gameData);
}

exports.action = function(id, action){
	if(action.type = 'm'){ //move
		var player = _.find(players, function(el){
			return el.id === id;
		});

		if(player){
			player.moveTo(action.x, action.y);
		}
	}
};

var removePlayerObj = function(el){
	delete gameData[el.id];
	players = players.filter(function(el2){
		return el2 != el;
	})
}

//return game data at end of loop
exports.loop = function(){

	for(var i=0; i<players.length; i++){
		players[i].tick();
	}

	filterRemoved();

	return gameData;
}

var filterRemoved = function(){
	for(var i=0; i<players.length; i++){
		var curr = players[i];
		if(curr.remove){
			players.splice(i, 1);
			i--;
			delete gameData[curr.id];
		}
	}
}

var Player = prototype.Class.create({
	initialize: function(x, y, id){
		this.pos = $V([Math.random()*400-200, Math.random()*400-200]);
		this.v = $V([0, 0]);
		this.a = $V([0, 0]);
		this.id = id;
		this.health = 1;
		this.remove = false;

		this.timeToReproduce = 0;

		this.rot = 0;
		this.tailRot = 0;
		this.lastAngle = 0;
	},

	getObj: function(){
		return{
			x: this.pos.el(0),
			y: this.pos.el(1),
			health: this.health,
			type: this.type,
			rep: this.timeToReproduce
		};
	},

	moveTo: function(x, y){
		var vec = $V([x, y]);
		var diff = vec.subtract(this.pos);
		this.v = diff.toUnitVector().multiply(playerSpeed);
	},

	updateGameData: function(){
		var datum = gameData[this.id]
		datum.x = this.pos.el(0);
		datum.y = this.pos.el(1);
		datum.health = this.health;
		datum.rep = this.timeToReproduce;
	},

	tick: function(){

		this.pos = this.pos.add(this.v);

		if(this.health >= 0){
			this.health -= decay;
		}else{
			this.remove = true;
			notifyRespawn(10, this.id);
		}
		
		if(this.timeToReproduce >= 0){
			this.timeToReproduce -= repDecay;
		}
		

		this.updateGameData();
	}
});

var Predator = prototype.Class.create(Player, {

	initialize: function($super, x, y, id){
		$super(x, y, id);
		this.type = 'Predator';
	},

	eat: function(other){
		other.remove = true;
		notifyRespawn(10, other.id);
		this.health = 1;
		this.timeToReproduce = 1;
	},
	
	tryEat: function(){
		for(var i=0; i<players.length; i++){
			var curr = players[i];
			if(curr != this){
				var dist = this.pos.distanceFrom(curr.pos);
				if(dist < playerRad*2 && curr.type === 'Prey'){
					console.log('eat');
					this.eat(curr);
					break;
				}
			}
		}
	},

	tick: function($super){

		this.tryEat();
		
		$super();
	}
});

var Prey = prototype.Class.create(Player, {

	initialize: function($super, x, y, id){
		$super(x, y, id);
		this.type = 'Prey';
	},
	
	tryEat: function(){
		for(var i=0; i<players.length; i++){
			var curr = players[i];
			if(curr.type !== 'Algae'){
				continue;
			}
			var dist = this.pos.distanceFrom(curr.pos);
			if(dist < playerRad + algaeRad){
				console.log('eat algae');
				
				delete gameData[curr.id];
				players = players.filter(function(el){
					return el.id !== curr.id;
				})

				this.health = 1;
				this.timeToReproduce = 1;

				setTimeout(function(){
					addAlgae();
				},1000*10);
				
				break;
			}
		}
	},

	tick: function($super){

		this.tryEat();
		
		$super();
	}
});

var Algae = prototype.Class.create(Player, {

	initialize: function($super, x, y, id){
		$super(x, y, id);
		this.type = 'Algae';
	},
	

	tick: function($super){

	}
});

var constructors = {
	'Predator': Predator,
	'Prey': Prey
};



