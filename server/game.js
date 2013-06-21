
var prototype = require('prototype'),
	_ = require('underscore'),
	utils = require('./utils');

require('sylvester');

var gameDataObj = {
	m:{
		pred: 0,
		prey: 0
	},
	p: {}
};

gameData = gameDataObj.p

var io;

var players = [];

var playerRad = 30;
var algaeRad = 20;

var params = {
	bboxX: 1500,
	bboxY: 1500,
	maxPlayers: 100,
	algaeRespawn: 5,
	preySpeed: 2,
	predatorSpeed: 1.5,
	decay: .0005,
	repDecay: .005,
	startPredators: 10,
	startPrey: 10,
	startAlgae: 10,
};

exports.getParams = function(){
	return params;
}

exports.setParams = function(pr){
	params = pr;
}

exports.ready = function(sio){

	io = sio;

	for(var i=0; i<params.startAlgae; i++){
		addAlgae();
	}

	for(var i=0; i<params.startPredators; i++){
		addAI('Predator');
	}

	for(var i=0; i<params.startPrey; i++){
		addAI('Prey');
	}

	setInterval(function(){
		addAlgae();
	},1000*params.algaeRespawn);

	console.log('server started');

}

setInterval(function(){
	console.log('#fish: ' + players.length);
}, 2000);

var getRandomPos = function(){
	return $V([
		Math.random()*params.bboxX-params.bboxX/2,
		Math.random()*params.bboxY-params.bboxY/2,
	]);
}

var getRandomVector = function(mag){
	return $V([Math.random(), Math.random]).toUnitVector().multiply(mag);
}

var addAlgae = function(){
	var id = utils.uniqueRandomString(20, gameData);
	var pos = getRandomPos();
	var al = new Algae(pos.elements[0], pos.elements[1], id);
}

var addAI = function(type){
	var id = utils.uniqueRandomString(20, gameData);
	var pos = getRandomPos();
	var newAI = new constructors[type](pos.elements[0], pos.elements[1], id);
	newAI.isAI = true;
}

var notify = function(msg, player){
	if(!player.isPlayer()){
		return;
	}

	io.sockets.sockets[player.id].emit('alert', msg);
};

exports.addPlayer = function(id){
	var newPlayer;
	var pos = getRandomPos();
	if(Math.random()<.5){
		newPlayer = new Predator(pos.elements[0], pos.elements[1], id);
	}else{
		newPlayer = new Prey(pos.elements[0], pos.elements[1],id);
	}
}

exports.removePlayer = function(id){
	delete gameData[id];
	players = players.filter(function(el){
		return el.id !== id;
	});
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

	var pred = 0,
		prey = 0;

	for(var i=0; i<players.length; i++){
		var curr = players[i];
		curr.tick();
		if(curr.type === 'Predator'){
			pred++;
		}else if(curr.type === 'Prey'){
			prey++;
		}
	}

	filterRemoved();

	gameDataObj.pred = pred;
	gameDataObj.prey = prey;

	gameDataObj.p = gameData;

	return gameDataObj;
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
		this.pos = $V([x, y]);
		this.v = $V([0, 0]);
		this.a = $V([0, 0]);
		this.id = id;
		this.health = 1;
		this.remove = false;

		this.timeToReproduce = 0;

		this.rot = 0;
		this.tailRot = 0;
		this.lastAngle = 0;

		if(players.length <= params.maxPlayers){
			//add self to structs
			gameData[this.id] = this.getObj();
			players.push(this);
		}
		
	},

	reproduce: function(){
		var child = new constructors[this.type](this.pos.elements[0],
			this.pos.elements[1], utils.uniqueRandomString(20, gameData));
		this.timeToReproduce = 0;
		child.isAI = true;
	},

	getNearestPlayers: function(){
		var nearest = {
			predator: null,
			prey: null,
			algae: null
		};

		var nearestDist = {
			predator: 1e9,
			prey: 1e9,
			algae: 1e9
		}

		for(var i=0; i<players.length; i++){
			var curr = players[i];
			if(curr != this){
				var dist = this.pos.distanceFrom(curr.pos);
				if(curr.type === 'Predator'){
					if(dist < nearestDist.predator){
						nearestDist.predator = dist;
						nearest.predator = curr;
					}
				}else if(curr.type == 'Prey'){
					if(dist < nearestDist.prey){
						nearestDist.prey = dist;
						nearest.prey = curr;
					}
				}else if(curr.type == 'Algae'){
					if(dist < nearestDist.algae){
						nearestDist.algae = dist;
						nearest.algae = curr;
					}
				}
				
				
			}
		}

		return {nearest: nearest, dist: nearestDist};
	},

	isPlayer: function(){
		if(this.isAI){
			return false;
		}

		if(!io.sockets.sockets[this.id]){
			return false;
		}

		return true;
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
		this.v = diff.toUnitVector().multiply(this.speed);
	},

	updateGameData: function(){
		var datum = gameData[this.id]
		datum.x = this.pos.el(0);
		datum.y = this.pos.el(1);
		datum.health = this.health;
		datum.rep = this.timeToReproduce;
	},

	addRandomVelocity: function(){
		var div = 4;
		this.v = this.v.add($V([
			Math.random()*this.speed/div - this.speed/div/2,
			Math.random()*this.speed/div - this.speed/div/2
		]))
	},

	tick: function(){

		this.pos = this.pos.add(this.v);

		if(this.pos.elements[0] - playerRad < -1*params.bboxX/2){
			this.pos.elements[0] = -1*params.bboxX/2 + playerRad;
		}

		if(this.pos.elements[0] + playerRad > params.bboxX/2){
			this.pos.elements[0] = params.bboxX/2 - playerRad;
		}

		if(this.pos.elements[1] - playerRad < -1*params.bboxY/2){
			this.pos.elements[1] = -1*params.bboxY/2 + playerRad;
		}

		if(this.pos.elements[1] + playerRad > params.bboxY/2){
			this.pos.elements[1] = params.bboxY/2 - playerRad;
		}

		if(this.health >= 0){
			this.health -= params.decay;
		}else{
			this.remove = true;
		}
		
		if(this.timeToReproduce >= 0){
			this.timeToReproduce -= params.repDecay;
		}
		

		this.updateGameData();
	}
});

var Predator = prototype.Class.create(Player, {

	initialize: function($super, x, y, id){
		this.type = 'Predator';
		this.speed = params.predatorSpeed;

		$super(x, y, id);
	},

	act: function(){
		var obj = this.getNearestPlayers();

		if(obj.nearest.predator && (this.timeToReproduce > 0 || obj.nearest.predator.timeToReproduce > 0)){

			if(this.isAI){
				this.v = obj.nearest.predator.pos.subtract(this.pos)
					.toUnitVector().multiply(this.speed);
				this.addRandomVelocity();
			}
			if(obj.dist.predator < playerRad*2 && this.timeToReproduce > 0){
				this.reproduce();
			}
		}
		else if(obj.nearest.prey){
			if(this.isAI){
				this.v = obj.nearest.prey.pos.subtract(this.pos)
					.toUnitVector().multiply(this.speed);
				this.addRandomVelocity();
			}
			if(obj.dist.prey < playerRad*2){
				this.eat(obj.nearest.prey);
			}
		}else{
			if(this.isAI){
				this.v = $V([0,0]);
			}
		}
	},

	eat: function(other){
		if(other.remove)
			return;

		other.remove = true;
		this.health = 1;
		this.timeToReproduce = 1;
	},

	tick: function($super){
		this.act();
		$super();
	}
});

var Prey = prototype.Class.create(Player, {

	initialize: function($super, x, y, id){
		this.type = 'Prey';
		this.speed = params.preySpeed;

		$super(x, y, id);
	},

	act: function(){
		var obj = this.getNearestPlayers();

		if(obj.nearest.prey && (this.timeToReproduce > 0 || obj.nearest.prey.timeToReproduce > 0)){

			if(this.isAI){
				this.v = obj.nearest.prey.pos.subtract(this.pos)
					.toUnitVector().multiply(this.speed);
				this.addRandomVelocity();
			}
			if(obj.dist.prey < playerRad*2 && this.timeToReproduce > 0){
				this.reproduce();
			}
		}
		else if(obj.nearest.predator && obj.dist.predator < obj.dist.algae){
			if(this.isAI){
				this.v = this.pos.subtract(obj.nearest.predator.pos)
					.toUnitVector().multiply(this.speed);
				this.addRandomVelocity();
			}
		}else if(obj.nearest.algae){
			if(this.isAI){
				this.v = obj.nearest.algae.pos.subtract(this.pos)
					.toUnitVector().multiply(this.speed);
				this.addRandomVelocity();
			}
			if(obj.dist.algae < playerRad + algaeRad){
				this.eat(obj.nearest.algae);
			}
		}else{
			if(this.isAI){
				this.v = $V([0,0]);
			}
		}
	},

	eat: function(algae){
		if(algae.remove)
			return;

		algae.remove = true;
		this.health = 1;
		this.timeToReproduce = 1;
	},

	tick: function($super){

		this.act();
		
		$super();
	}
});

var Algae = prototype.Class.create(Player, {

	initialize: function($super, x, y, id){
		this.type = 'Algae';
		$super(x, y, id);
	},
	

	tick: function($super){
		this.updateGameData();
	}
});

var constructors = {
	'Predator': Predator,
	'Prey': Prey
};

