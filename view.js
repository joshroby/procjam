var map;

var view = {

	focus: {},

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
			view.currentZoom.z = Math.max(Math.min(view.currentZoom.z,1),0.01);
			view.currentZoom.viewBox.minX = view.currentZoom.viewBox.minX + view.currentZoom.viewBox.width/2 - view.currentZoom.z*view.map.sizeX/2;
			view.currentZoom.viewBox.minY = view.currentZoom.viewBox.minY + view.currentZoom.viewBox.height/2 - view.currentZoom.z*view.map.sizeY/2;
			view.currentZoom.viewBox.width = view.currentZoom.z * view.map.sizeX;
			view.currentZoom.viewBox.height = view.currentZoom.z * view.map.sizeY;
		};
		var mapSVG = document.getElementById('mapSVG');
		var viewBoxString = view.currentZoom.viewBox.minX + ' ' + view.currentZoom.viewBox.minY + ' ' + view.currentZoom.viewBox.width + ' ' + view.currentZoom.viewBox.height;
		mapSVG.setAttribute('viewBox',viewBoxString);
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
			var mapSVG = document.getElementById('mapSVG');
			var viewBoxString = view.currentZoom.viewBox.minX + ' ' + view.currentZoom.viewBox.minY + ' ' + view.currentZoom.viewBox.width + ' ' + view.currentZoom.viewBox.height;
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
		console.time('render');
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
		
		var tileGroup = document.createElementNS('http://www.w3.org/2000/svg','g');
		mapSVG.appendChild(tileGroup);
		
		console.time('tile rendering');
		for (tile of map.tiles) {
			var polygon = document.createElementNS('http://www.w3.org/2000/svg','polygon');
			tileGroup.appendChild(polygon);
			if (tile.color == undefined) {
				if (tile.ice) {
					var red = 95,green = 95,blue= 99;
				} else if (tile.z <= 0) {
					if (tile.temperature > -2) {
						var depth = 50 - Math.max(-10,tile.z) * -5;
						tile.color = 'rgb('+depth+'%,'+depth+'%,100%)';
					};
				} else if (tile.vertices[1].z == tile.vertices[2].z && tile.vertices[0].z == tile.vertices[2].z) {
					tile.color = 'rgb(50%,50%,100%)';
					red = 50;
					green = 50;
					blue = 100;
				} else {
					var red = 100, green = 90, blue = 80;
					var precipitationFactor = tile.precipitation / 10;
					red -= 90 * precipitationFactor;
					green -= 40 * precipitationFactor;
					blue -= 60 * precipitationFactor;
				};
				if (tile.z > 0) {
					if (tile.temperature < 0) {
						var temperatureFactor = Math.min(tile.temperature * -10,100);
						red = (red * (100-temperatureFactor) + 100 * temperatureFactor) / 100;
						green = (green * (100-temperatureFactor) + 100 * temperatureFactor) / 100;
						blue = (blue * (100-temperatureFactor) + 100 * temperatureFactor) / 100;
						if (tile.vertices[1].z == tile.vertices[2].z && tile.vertices[0].z == tile.vertices[2].z) {
							red = Math.min(red,90);
							green = Math.min(green,90);
							blue = Math.min(blue,99);
						};
					};
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
					var slope = westVertex.z - eastVertex.z;
					if (isNaN(slope) || slope == Infinity) {
						slope = 0;
					};
					tile.slope = slope;
					red += slope;
					green += slope;
					blue += slope;
					red = Math.min(100,red);
					green = Math.min(100,green);
					blue = Math.min(100,blue);
					tile.color = 'rgb('+red+'%,'+green+'%,'+blue+'%)';
				};
			};
			polygon.setAttribute('fill',tile.color);
			polygon.setAttribute('stroke',tile.color);
			polygon.setAttribute('stroke-width',0.5);
			polygon.setAttribute('stroke-linecap','round');
			var tileVertices = '';
			for (v of tile.vertices) {
				tileVertices += v.x + ',' + v.y + ' ';
			};
			polygon.setAttribute('points',tileVertices);
			tile.polygon = polygon;
			polygon.addEventListener('click',view.displayDetails.bind(this,tile));
		};
		console.timeEnd('tile rendering');
		for (var v of map.vertices) {
			var circle = document.createElementNS('http://www.w3.org/2000/svg','circle');
			circle.setAttribute('cx',v.x);
			circle.setAttribute('cy',v.y);
			circle.setAttribute('r',5);
			circle.setAttribute('fill',v.plate.color);
// 			mapSVG.appendChild(circle);
		};
		console.time('cursor');
		if (view.focus.tile !== undefined) {
			for (var n of view.focus.tile.adjacent) {
				var polygon = document.createElementNS('http://www.w3.org/2000/svg','polygon');
				polygon.setAttribute('fill','none');
				polygon.setAttribute('stroke','yellow');
				polygon.setAttribute('stroke-linecap','round');
				var tileVertices = '';
				for (v of n.vertices) {
					tileVertices += v.x + ',' + v.y + ' ';
				};
				polygon.setAttribute('points',tileVertices);
				mapSVG.appendChild(polygon);
			var polygon = document.createElementNS('http://www.w3.org/2000/svg','polygon');
			polygon.setAttribute('fill','none');
			polygon.setAttribute('stroke','red');
			polygon.setAttribute('stroke-linecap','round');
			var tileVertices = '';
			for (v of view.focus.tile.vertices) {
				tileVertices += v.x + ',' + v.y + ' ';
			};
			polygon.setAttribute('points',tileVertices);
			mapSVG.appendChild(polygon);
			};
		};
		console.timeEnd('cursor');
		console.time('rivers rendering');
		for (var edge of map.edges) {
			if (edge.drainage > 0 || edge.topVertex.z == edge.bottomVertex.z) {
				var line = document.createElementNS('http://www.w3.org/2000/svg','line');
				if (edge.tiles.length == 2 && (edge.tiles[0].temperature > -2 || edge.tiles[1].temperature > -2)) {
					line.setAttribute('stroke','rgb(50%,50%,100%)');
				} else {
					line.setAttribute('stroke','rgb(90%,90%,99%)');
				};
				line.setAttribute('stroke-linecap','round');
				line.setAttribute('x2',edge.bottomVertex.x);
				line.setAttribute('y2',edge.bottomVertex.y);
				if (edge.drainage > 0) { // regular river
					line.setAttribute('stroke-width',view.riverWidth(edge.drainage,map));
					if (!edge.tributaries) {
						line.setAttribute('x1',(edge.topVertex.x+edge.bottomVertex.x)/2);
						line.setAttribute('y1',(edge.topVertex.y+edge.bottomVertex.y)/2);
					} else {
						line.setAttribute('x1',edge.topVertex.x);
						line.setAttribute('y1',edge.topVertex.y);
					};
					tileGroup.appendChild(line);
				};
				if (edge.topVertex.z !== 0 && edge.topVertex.z == edge.bottomVertex.z) { // basin edge
					line.setAttribute('stroke-width',view.riverWidth(edge.bottomVertex.downhill.drainage,map));
					line.setAttribute('x1',edge.topVertex.x);
					line.setAttribute('y1',edge.topVertex.y);
					tileGroup.appendChild(line);
				};
			};
		};
		console.timeEnd('rivers rendering');
		var latitudes = []; // was 0,30,-30,60,-60
		for (latitude of latitudes) {
			latitude = (Math.sin(latitude * Math.PI / 180) * map.sizeY - map.sizeY ) / -2;
			var line = document.createElementNS('http://www.w3.org/2000/svg','line');
			line.setAttribute('x1',0);
			line.setAttribute('y1',latitude);
			line.setAttribute('x2',map.sizeX);
			line.setAttribute('y2',latitude);
			line.setAttribute('stroke','yellow');
			mapSVG.appendChild(line);
		};
		console.timeEnd('render');
		console.log(map.tiles.length + ' tiles');
	},
	
	riverWidth: function(drainage,map) {
		return Math.min(drainage * 0.0075 * map.step,map.step * 0.25);
	},
	
	displayDetails: function(tile) {
		console.log(tile);
		view.focus.tile = tile;
// 		view.renderMap(map);
		var detailsDiv = document.getElementById('detailsDiv');
		detailsDiv.innerHTML = '';
		var tileHead = document.createElement('h3');
		tileHead.innerHTML = 'Tile';
		detailsDiv.appendChild(tileHead);
		var latitudeP = document.createElement('p');
		latitudeP.innerHTML = "Latitude: " + tile.latitude;
		detailsDiv.appendChild(latitudeP);
		var elevationP = document.createElement('p');
		elevationP.innerHTML = "Elevation: " + tile.z;
		detailsDiv.appendChild(elevationP);
		var pressureP = document.createElement('p');
		pressureP.innerHTML = "Atmo Pressure: " + tile.pressure;
		detailsDiv.appendChild(pressureP);
		var precipitationP = document.createElement('p');
		precipitationP.innerHTML = "Precipitation: " + tile.precipitation + 'mm/day (avg)';
		detailsDiv.appendChild(precipitationP);
		var temperatureP = document.createElement('p');
		temperatureP.innerHTML = "Temperature: " + tile.temperature + ' celsius';
		detailsDiv.appendChild(temperatureP);
		var slopeP = document.createElement('p');
		slopeP.innerHTML = "Slope: " + tile.slope;
		detailsDiv.appendChild(slopeP);
		var biomeP = document.createElement('p');
		biomeP.innerHTML = "Biome: " + tile.biome;
		detailsDiv.appendChild(biomeP);
// 		var letters = ['A','B','C'];
// 		for (var key of ['downhill','slope','precipitation','z']) {
// 			var tileP = document.createElement('p');
// 			tileP.innerHTML = key + ' ' + tile[key];
// // 			detailsDiv.appendChild(tileP);
// 		};
// 		for (v in tile.vertices) {
// 			var vertexP = document.createElement('p');
// 			vertexP.innerHTML = 'Vertex '+letters[v];
// 			vertexP.innerHTML += '<br />x ' + tile.vertices[v].x;
// 			vertexP.innerHTML += '<br />y ' + tile.vertices[v].y;
// 			vertexP.innerHTML += '<br />z ' + tile.vertices[v].z;
// 			detailsDiv.appendChild(vertexP);
// 		};
// 		for (e in tile.edges) {
// 			var edgeName = letters[tile.vertices.indexOf(tile.edges[e].topVertex)] + letters[tile.vertices.indexOf(tile.edges[e].bottomVertex)];
// 			var edgeP = document.createElement('p');
// 			edgeP.innerHTML = 'Edge '+edgeName;
// 			edgeP.innerHTML += '<br />(' + Math.round(tile.edges[e].topVertex.x) + ',' + Math.round(tile.edges[e].topVertex.y) + ') ' + Math.round(tile.edges[e].topVertex.z*100)/100;
// 			edgeP.innerHTML += '<br />(' + Math.round(tile.edges[e].bottomVertex.x) + ',' + Math.round(tile.edges[e].bottomVertex.y) + ') ' + Math.round(tile.edges[e].bottomVertex.z*100)/100;
// 			edgeP.innerHTML += '<br />Flow ' + tile.edges[e].drainage;
// 			if (tile.edges[e].bottomVertex.downhill !== undefined) {
// 				edgeP.innerHTML += '<br />Downhill (' + Math.round(tile.edges[e].bottomVertex.downhill.bottomVertex.x) + ',' + Math.round(tile.edges[e].bottomVertex.downhill.bottomVertex.y) + ') ' + tile.edges[e].bottomVertex.downhill.drainage + ' flow';
// 			} else {
// 				edgeP.innerHTML += '<br />Downhill undefined';
// 			};
// 			detailsDiv.appendChild(edgeP);
// 		};
// 		view.focus.tile = tile;
// 		view.renderMap(map);
	},
	
	displayVertex: function(v) {
		console.log(v);
		view.focus.vertex = v;
		view.renderMap(map);
	},
};

