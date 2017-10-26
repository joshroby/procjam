var map;

var view = {

	currentZoom: {
		z: 1,
		viewBox: {
			minX: 0,
			minY: 0,
			height: 100,
			width: 100,
		}
	},
	
	zoom: function(e) {
		var zoomFactor = e.deltaY;
		if (view.currentZoom.z == 1 && zoomFactor > 0) {
			view.currentZoom.viewBox.minX = 0;
			view.currentZoom.viewBox.minY = 0;
			view.currentZoom.viewBox.height = view.map.sizeY;
			view.currentZoom.viewBox.width = view.map.sizeX;
		} else {
			view.currentZoom.z += zoomFactor * .002;
			view.currentZoom.z = Math.max(Math.min(view.currentZoom.z,1),0.1);
			view.currentZoom.viewBox.minX = view.currentZoom.viewBox.minX + view.currentZoom.viewBox.width/2 - view.currentZoom.z*view.map.sizeX/2;
			view.currentZoom.viewBox.minY = view.currentZoom.viewBox.minY + view.currentZoom.viewBox.height/2 - view.currentZoom.z*view.map.sizeY/2;
			view.currentZoom.viewBox.width = view.currentZoom.z * view.map.sizeX;
			view.currentZoom.viewBox.height = view.currentZoom.z * view.map.sizeY;
		};
		view.renderMap(view.map);
	},

	mapDragStart: function(e) {
		view.currentZoom.dragging = true;
		view.currentZoom.dragStartX = e.pageX;
		view.currentZoom.dragStartY = e.pageY;
	},
	
	mapDragGo: function(e) {
		if (view.currentZoom.dragging) {
			var viewBox = view.currentZoom.viewBox;
			var diffX = e.pageX - view.currentZoom.dragStartX;
			var diffY = e.pageY - view.currentZoom.dragStartY;
			var zoomFactor = view.currentZoom.z;
			var newMinX = viewBox.minX - diffX*zoomFactor;
			var newMinY = viewBox.minY - diffY*zoomFactor;
			if ((newMinX > 0 && newMinX + viewBox.width < 1000) || (newMinX < 0 && newMinX > viewBox.minX) || (newMinX+viewBox.width > 1000 && newMinX+viewBox.width < viewBox.minX + viewBox.width)) {
				view.currentZoom.dragStartX = e.pageX;
				viewBox.minX = newMinX;
			};
			if ((newMinY > 0 && newMinY + viewBox.height < 1000) || (newMinY < 0 && newMinY > viewBox.minY) || (newMinY+viewBox.height > 1000 && newMinY+viewBox.height < viewBox.minY + viewBox.height)) {
				view.currentZoom.dragStartY = e.pageY;
				viewBox.minY = newMinY;
			};
			var viewBoxString = viewBox.minX + ' ' + viewBox.minY + ' ' + viewBox.width + ' ' + viewBox.height;
			mapSVG.setAttribute('viewBox',viewBoxString);
		};
	},
	
	mapDragEnd: function(e) {
		view.currentZoom.dragging = false;
	},


	load: function() {
		console.log('loading');
		map = new Map();
		view.currentZoom.viewBox.width = map.sizeX;
		view.currentZoom.viewBox.height = map.sizeY;
		console.log(map);
		view.renderMap(map);
	},

	renderMap: function(map) {
		view.map = map;
		
		var mapSVG = document.getElementById('mapSVG');
		var viewBoxString = view.currentZoom.viewBox.minX + ' ' + view.currentZoom.viewBox.minY + ' ' + view.currentZoom.viewBox.width + ' ' + view.currentZoom.viewBox.height;
		mapSVG.setAttribute('viewBox',viewBoxString);
		
		mapSVG.style.width = map.sizeX;
		mapSVG.style.z = map.sizeY;
		
		mapSVG.addEventListener('mousedown',view.mapDragStart);
		mapSVG.addEventListener('mousemove',view.mapDragGo);
		mapSVG.addEventListener('mouseup',view.mapDragEnd);
		mapSVG.addEventListener('mouseleave',view.mapDragEnd);
		
		mapSVG.addEventListener('wheel',view.zoom);
		
		var landGroup = document.createElementNS('http://www.w3.org/2000/svg','g');
		mapSVG.appendChild(landGroup);
		
		var oceanGroup = document.createElementNS('http://www.w3.org/2000/svg','g');
		mapSVG.appendChild(oceanGroup);
		
		for (tile of map.tiles) {
			var polygon = document.createElementNS('http://www.w3.org/2000/svg','polygon');
			if (tile.z <= 0) {
				oceanGroup.appendChild(polygon);
				var depth = 50 - Math.max(-3,tile.z) * -16;
				tile.color = 'rgb('+depth+'%,'+depth+'%,100%)';
			} else {
				landGroup.appendChild(polygon);
				var red = 20, green = 50, blue = 0;
				var elevation = Math.min(5,tile.z);
				var eastVertex, centerVertex, westVertex;
				if (tile.vertices[0].x < tile.vertices[1].x && tile.vertices[0].x < tile.vertices[2].x) {
					westVertex = tile.vertices[0];
					if (tile.vertices[1] > tile.vertices[2]) {
						eastVertex = tile.vertices[1];
						centerVertex = tile.vertices[2];
					} else {
						centerVertex = tile.vertices[1];
						eastVertex = tile.vertices[2];
					};
				} else if (tile.vertices[1].x < tile.vertices[0].x && tile.vertices[1].x < tile.vertices[2].x) {
					westVertex = tile.vertices[1];
					if (tile.vertices[0] > tile.vertices[2]) {
						eastVertex = tile.vertices[0];
						centerVertex = tile.vertices[2];
					} else {
						centerVertex = tile.vertices[0];
						eastVertex = tile.vertices[2];
					};
				} else {
					westVertex = tile.vertices[2];
					if (tile.vertices[1] > tile.vertices[0]) {
						eastVertex = tile.vertices[1];
						centerVertex = tile.vertices[0];
					} else {
						centerVertex = tile.vertices[1];
						eastVertex = tile.vertices[0];
					};
				};
				var slope = Math.max(0.95,Math.min(1.05,westVertex.z/eastVertex.z));
				if (isNaN(slope)) {
					slope = 1;
				};
				tile.slope = slope;
				red = (red + slope*100)/3;
				green = (green + slope*100)/3;
				blue = (blue + slope*100)/3;
				tile.color = 'rgb('+red+'%,'+green+'%,'+blue+'%)';
				if (tile.vertices[1].z == tile.vertices[2].z && tile.vertices[0].z == tile.vertices[2].z) {
					tile.color = 'rgb(50%,50%,100%)';
				};
			};
			polygon.setAttribute('fill',tile.color);
			polygon.setAttribute('stroke',tile.color);
// 			polygon.setAttribute('stroke','grey');
			var tileVertices = '';
			for (v of tile.vertices) {
				tileVertices += v.x + ',' + v.y + ' ';
			};
			polygon.setAttribute('points',tileVertices);
			tile.polygon = polygon;
			polygon.addEventListener('click',view.displayDetails.bind(this,tile));
		};
		if (view.focus !== undefined) {
			var polygon = document.createElementNS('http://www.w3.org/2000/svg','polygon');
			polygon.setAttribute('fill','none');
			polygon.setAttribute('stroke','red');
			var tileVertices = '';
			for (v of view.focus.vertices) {
				tileVertices += v.x + ',' + v.y + ' ';
			};
			polygon.setAttribute('points',tileVertices);
			mapSVG.appendChild(polygon);
			for (v in view.focus.vertices) {
// 				var color = ['lightblue','limegreen','yellow'][v];
// 				var label = document.createElementNS('http://www.w3.org/2000/svg','text');
// 				label.setAttribute('x',view.focus.vertices[v].x);
// 				label.setAttribute('y',view.focus.vertices[v].y);
// 				label.innerHTML = v;
// 				mapSVG.appendChild(label);
// 				var line = document.createElementNS('http://www.w3.org/2000/svg','line');
// 				line.setAttribute('stroke',color);
// 				line.setAttribute('x1',view.focus.vertices[v].x);
// 				line.setAttribute('y1',view.focus.vertices[v].y);
// 				line.setAttribute('x2',view.focus.vertices[v].downhill.bottomVertex.x);
// 				line.setAttribute('y2',view.focus.vertices[v].downhill.bottomVertex.y);
// 				mapSVG.appendChild(line);
// 				var circle = document.createElementNS('http://www.w3.org/2000/svg','circle');
// 				circle.setAttribute('stroke',color);
// 				circle.setAttribute('fill','none');
// 				circle.setAttribute('cx',view.focus.vertices[v].downhill.bottomVertex.x);
// 				circle.setAttribute('cy',view.focus.vertices[v].downhill.bottomVertex.y);
// 				circle.setAttribute('r',10+v*2);
// 				mapSVG.appendChild(circle);
// 				var circle = document.createElementNS('http://www.w3.org/2000/svg','circle');
// 				circle.setAttribute('stroke',color);
// 				circle.setAttribute('fill','none');
// 				circle.setAttribute('cx',view.focus.vertices[v].x);
// 				circle.setAttribute('cy',view.focus.vertices[v].y);
// 				circle.setAttribute('r',5+v*2);
// 				mapSVG.appendChild(circle);
			};
		};
		for (var edge of map.edges) {
			if (edge.drainage > 0 ) {
				var line = document.createElementNS('http://www.w3.org/2000/svg','line');
				line.setAttribute('stroke','rgb(50%,50%,100%)');
				line.setAttribute('stroke-width',Math.min(edge.drainage * 0.2,5));
				line.setAttribute('stroke-linecap','round');
				if (edge.drainage <= 1 && false) {
					line.setAttribute('x1',(edge.topVertex.x+edge.bottomVertex.x)/2);
					line.setAttribute('y1',(edge.topVertex.y+edge.bottomVertex.y)/2);
				} else {
					line.setAttribute('x1',edge.topVertex.x);
					line.setAttribute('y1',edge.topVertex.y);
				};
				line.setAttribute('x2',edge.bottomVertex.x);
				line.setAttribute('y2',edge.bottomVertex.y);
				landGroup.appendChild(line);
			};
		};
		for (var v of map.vertices) {
			if (v.basin !== false) {
				var circle = document.createElementNS('http://www.w3.org/2000/svg','circle');
				circle.setAttribute('fill','red');
				circle.setAttribute('opacity',1);
				circle.setAttribute('cx',v.x);
				circle.setAttribute('cy',v.y);
				circle.setAttribute('r',2);
// 				mapSVG.appendChild(circle);
			};
			var zText = document.createElementNS('http://www.w3.org/2000/svg','text');
			zText.innerHTML = "("+Math.round(v.x)+","+Math.round(v.y)+") "+Math.round(v.z*100);
			zText.setAttribute('x',v.x);
			zText.setAttribute('y',v.y);
			zText.setAttribute('text-anchor','middle');
			zText.setAttribute('font-size',3);
			mapSVG.appendChild(zText);
		};
	},
	
	displayDetails: function(tile) {
		console.log(tile);
		var letters = ['A','B','C'];
		var detailsDiv = document.getElementById('detailsDiv');
		detailsDiv.innerHTML = '';
		var tileHead = document.createElement('h3');
		tileHead.innerHTML = 'Tile';
		detailsDiv.appendChild(tileHead);
		for (var key of ['downhill','slope','precipitation','z']) {
			var tileP = document.createElement('p');
			tileP.innerHTML = key + ' ' + tile[key];
// 			detailsDiv.appendChild(tileP);
		};
		for (v in tile.vertices) {
			var vertexP = document.createElement('p');
			vertexP.innerHTML = 'Vertex '+letters[v];
			vertexP.innerHTML += '<br />x ' + tile.vertices[v].x;
			vertexP.innerHTML += '<br />y ' + tile.vertices[v].y;
			vertexP.innerHTML += '<br />z ' + tile.vertices[v].z;
			detailsDiv.appendChild(vertexP);
		};
		for (e in tile.edges) {
			var edgeName = letters[tile.vertices.indexOf(tile.edges[e].topVertex)] + letters[tile.vertices.indexOf(tile.edges[e].bottomVertex)];
			var edgeP = document.createElement('p');
			edgeP.innerHTML = 'Edge '+edgeName;
			edgeP.innerHTML += '<br />(' + Math.round(tile.edges[e].topVertex.x) + ',' + Math.round(tile.edges[e].topVertex.y) + ') ' + Math.round(tile.edges[e].topVertex.z*100)/100;
			edgeP.innerHTML += '<br />(' + Math.round(tile.edges[e].bottomVertex.x) + ',' + Math.round(tile.edges[e].bottomVertex.y) + ') ' + Math.round(tile.edges[e].bottomVertex.z*100)/100;
			edgeP.innerHTML += '<br />Flow ' + tile.edges[e].drainage;
			if (tile.edges[e].bottomVertex.downhill !== undefined) {
				edgeP.innerHTML += '<br />Downhill (' + Math.round(tile.edges[e].bottomVertex.downhill.bottomVertex.x) + ',' + Math.round(tile.edges[e].bottomVertex.downhill.bottomVertex.y) + ') ' + tile.edges[e].bottomVertex.downhill.drainage + ' flow';
			} else {
				edgeP.innerHTML += '<br />Downhill undefined';
			};
			detailsDiv.appendChild(edgeP);
		};
		view.focus = tile;
		view.renderMap(map);
	},
};

