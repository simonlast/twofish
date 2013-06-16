
var play = function(pjs) {

	var bkg = pjs.color(245,255,245);
	var gray = pjs.color(100,30);

	var playerId = null;

	var players = {};

	var playerRad = 30;
	var algaeRad = 20;

	var playerFinSize = new pjs.PVector(10,20);

	var preyCol = pjs.color(255,156,91);
	var predatorCol = pjs.color(135,189,177);
	var algaeCol = pjs.color(136,166,94,120);

	var player, players;

	var algaeCount = 0;

	var translate;

	pjs.setupScreen = function(){
		pjs.size(pjs.screenWidth,pjs.screenHeight);
		translate = new pjs.PVector(pjs.width/2, pjs.height/2);
	};

	pjs.setup = function(){
		pjs.setupScreen();
		pjs.noStroke();
		pjs.smooth();
		pjs.textAlign(pjs.LEFT);

		players = [];
		algae = [];
	};

	pjs.mousePressed = function(){
		Comm.submitAction({
			type: 'm',
			x: pjs.mouseX - translate.x,
			y: pjs.mouseY - translate.y
		});
	}

	pjs.mouseDragged = function(){
		pjs.mousePressed();
	}

	pjs.draw = function(){
		pjs.background(bkg);

		pjs.pushMatrix();
		pjs.translate(translate.x, translate.y);
		
		for(var i=0; i<algae.length; i++){
			algae[i].render();
		}

		for(var i=0; i<players.length; i++){
			players[i].render();
		}

		pjs.popMatrix();

		if(player){
			displayHealth();
		}
	};

	pjs.setPlayerId = function(id){
		playerId = id;
	};

	pjs.joinData = function(){

		if(!playerId)
			return;

		var arr = Object.keys(gameData);
		var len = arr.length;
		for(var i=0; i<len; i++){
			//for now just add
			var id = arr[i];

			var el = _.find(players, function(el){
				return el.id === id;
			});

			if(!el){
				var obj = gameData[id];
				var newPlayer = new constructors[obj.type](obj.x, obj.y, id);
				players.push(newPlayer);

				
				if(id == playerId){
					player = newPlayer;
				}
			}
		}

		//check for removed
		players = players.filter(function(el){
			var id = _.find(arr, function(curr){
				return el.id === curr;
			});
			if(id){
				return true;
			}
			return false;
		});

	}

	var displayHealth = function(){
		if(player.health > 0){
			pjs.fill(gray);
			pjs.rect(10,10,pjs.width/4+10, 50+10);
			pjs.fill(player.col);
			pjs.rect(15,15,player.health*pjs.width/4, 50);		
		}
			
	}

	var Player = Class.create({
		initialize: function(x, y, id){
			this.pos = new pjs.PVector(x, y);
			this.v = new pjs.PVector();
			this.a = new pjs.PVector();
			this.remove = false;
			this.id = id;
			this.health = 1;
			this.timeToReproduce = 0;

			this.rot = 0;
			this.tailRot = 0;
			this.lastAngle = 0;
		},

		update: function(){
			var obj = gameData[this.id];
			this.pos.x = obj.x;
			this.pos.y = obj.y;
			this.health = obj.health;
			this.timeToReproduce = obj.rep;
		},

		render: function(){
			var lastPos = new pjs.PVector(this.pos.x, this.pos.y);
			this.update();
			
			/*var tweenPos = new pjs.PVector((gameData[this.id].x - this.pos.x)*.9,
				(gameData[this.id].y - this.pos.y)*.9);*/
			

			var diff = pjs.PVector.sub(this.pos, lastPos);
			var angle = Math.atan(diff.y / diff.x);

			angle += Math.PI/2;

			if(diff.x > 0){
				angle += Math.PI;
			}

			if(angle){
				var rem = angle % 2*Math.PI;
				var lastRem = this.lastAngle % 2*Math.PI;

				var diff = Math.atan2(Math.sin(angle-this.lastAngle), Math.cos(angle-this.lastAngle));

				angle = this.lastAngle + diff;

				this.lastAngle = angle;
				this.rot += (angle - this.rot)*.1;
				this.tailRot += (angle - this.tailRot)*.07;
			}
			
			pjs.pushMatrix();
			pjs.translate(this.pos.x, this.pos.y);
			pjs.rotate(this.rot);

			if(this == player){
				pjs.fill(gray);
				var add = 15 + this.timeToReproduce*40;
				pjs.ellipse(0, 0, playerRad*2 + add, playerRad*2 + add);
			}
			pjs.fill(this.col);

			pjs.triangle(0 - playerRad, 0, 
				0 - playerFinSize.x - playerRad, 0 - playerFinSize.y,
				0 + playerFinSize.x - playerRad, 0 - playerFinSize.y);

			pjs.triangle(0 + playerRad, 0, 
				0 - playerFinSize.x + playerRad, 0 -playerFinSize.y,
				0 + playerFinSize.x + playerRad, 0 - playerFinSize.y);

			pjs.rotate(this.tailRot - this.rot);

			pjs.triangle(0, 0 - playerRad + playerFinSize.y, 
				0 - playerFinSize.x*3/2, 0 - playerRad - playerFinSize.y/2,
				0 + playerFinSize.x*3/2, 0 - playerRad - playerFinSize.y/2);

			pjs.ellipse(0, 0, playerRad*2, playerRad*2);

			pjs.popMatrix();
		}
	});

	var Predator = Class.create(Player, {
		initialize: function($super, x, y, id){
			$super(x, y, id);
			this.type = 'Predator';
			this.col = predatorCol;
		}
	});


	var Prey = Class.create(Player, {
		initialize: function($super, x, y, id){
			$super(x, y, id);
			this.type = 'Prey';
			this.col = preyCol;
		}
	});

	var Algae = Class.create(Player, {
		initialize: function($super, x, y, id){
			$super(x, y, id);
			this.type = 'Algae';
			this.col = algaeCol;
		},

		render: function(){
			pjs.fill(this.col);
			pjs.ellipse(this.pos.x, this.pos.y, algaeRad*2, algaeRad*2);
		}
	});

	var constructors = {
		'Predator': Predator,
		'Prey': Prey,
		'Algae': Algae
	};

};

var canvas = document.getElementById("pcanvas");
var pjs = new Processing(canvas, play);

//set up resize event
window.onresize = function(event) {
   pjs.setupScreen();
}
