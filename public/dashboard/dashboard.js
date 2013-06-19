
var Dash = {};

Dash.els = [];

Dash.container = document.getElementById('container');

Dash.create = function(){
	var keys = Object.keys(Comm.params);

	_.each(keys, function(key){
		var el = document.createElement('div');
		el.className = 'select-bar-hit';

		var bkg = document.createElement('div');
		bkg.className = 'select-bar-bkg';
		el.appendChild(bkg);

		var ratio = document.createElement('div');
		ratio.className = 'select-bar-ratio';
		el.appendChild(ratio);

		var label = document.createElement('span');
		label.className = 'param-label';
		label.innerHTML = key;
		el.appendChild(label);

		var num = Comm.params[key];

		var num_label = document.createElement('span');
		num_label.className = 'num-label';
		num_label.innerHTML = num;
		el.appendChild(num_label);

		Dash.els.push(el);
		Dash.container.appendChild(el);

		el.addEventListener('click', function(e){
		   var perc = e.layerX / el.offsetWidth;
		   console.log(perc);

		   ratio.style.width = perc*100 + '%';

		   var newNum = (perc*2)*num;
		   num_label.innerHTML = newNum;
		}, false);
	});
}