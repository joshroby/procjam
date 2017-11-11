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
	
	pageContents: function() {
		var pageContents = [];
		var controlsDiv = document.createElement('div');
		controlsDiv.id = 'controlsDiv';
		pageContents.push(controlsDiv);
		var newMapDiv = document.createElement('div');
		controlsDiv.appendChild(newMapDiv);
		var newMapHead = document.createElement('h3');
		newMapHead.innerHTML = 'New Map';
		newMapHead.setAttribute('onclick','handlers.toggleDetails("newMap")');
		newMapDiv.appendChild(newMapHead);
		var newMapDetailsDiv = document.createElement('div');
		newMapDetailsDiv.id = 'newMapDetailsDiv';
		newMapDiv.appendChild(newMapDetailsDiv);
		for (var slider of ['resolution','impacts','tectonics','wetness','orbit']) {
			var sliderP = document.createElement('p');
			sliderP.innerHTML = slider;
			newMapDetailsDiv.appendChild(sliderP);
			var newSlider = document.createElement('input');
			newSlider.id = slider + 'Input';
			newSlider.setAttribute('type','range');
			newSlider.setAttribute('min',1);
			newSlider.setAttribute('max',10);
			newSlider.setAttribute('value',5);
			sliderP.prepend(newSlider);
		};
		var newMapBtn = document.createElement('button');
		newMapBtn.innerHTML = 'Generate New Map';
		newMapBtn.setAttribute('onclick','handlers.newMap()');
		newMapDetailsDiv.appendChild(newMapBtn);
		var historyDiv = document.createElement('div');
		historyDiv.id = 'historyDiv';
		historyDiv.style.display = 'none';
		controlsDiv.appendChild(historyDiv);
		var historyHead = document.createElement('h3');
		historyHead.innerHTML = 'History';
		historyHead.setAttribute('onclick','handlers.toggleDetails("history")');
		historyDiv.appendChild(historyHead);
		var historyDetailsDiv = document.createElement('div');
		historyDetailsDiv.id = 'historyDetailsDiv';
		historyDiv.appendChild(historyDetailsDiv);
		var generationBtn = document.createElement('button');
		generationBtn.innerHTML = 'One Generation';
		generationBtn.setAttribute('onclick','handlers.oneGeneration()');
		historyDetailsDiv.appendChild(generationBtn);
		var goBtn = document.createElement('button');
		goBtn.innerHTML = 'Go';
		goBtn.setAttribute('onclick','handlers.historyGo()');
		historyDetailsDiv.appendChild(goBtn);
		var stopBtn = document.createElement('button');
		stopBtn.innerHTML = 'Stop';
		stopBtn.setAttribute('onclick','handlers.historyStop()');
		historyDetailsDiv.appendChild(stopBtn);
		var generationsDiv = document.createElement('div');
		generationsDiv.id = 'generationsDiv';
		historyDetailsDiv.appendChild(generationsDiv);
		var detailsDiv = document.createElement('div');
		detailsDiv.id = 'detailsDiv';
		controlsDiv.appendChild(detailsDiv);
		var mapControlsDiv = document.createElement('div');
		controlsDiv.appendChild(mapControlsDiv);
		var mapControlsHead = document.createElement('h3');
		mapControlsHead.innerHTML = "Map Controls";
		mapControlsHead.setAttribute('onclick','handlers.toggleDetails("mapControls")');
		mapControlsDiv.appendChild(mapControlsHead);
		var mapControlsDetailsDiv = document.createElement('div');
		mapControlsDetailsDiv.id = 'mapControlsDetailsDiv';
		mapControlsDetailsDiv.style.display = 'none';
		mapControlsDiv.appendChild(mapControlsDetailsDiv);
		for (var btn of ['plates','biome','physical','political']) {
			var newBtn = document.createElement('button');
			newBtn.innerHTML = btn.charAt(0).toUpperCase() + btn.slice(1);
			newBtn.setAttribute('onclick','view.toggleMap("'+btn+'")');
			mapControlsDetailsDiv.appendChild(newBtn);
		};
		var saveMapDiv = document.createElement('div');
		saveMapDiv.id = 'saveMapDiv';
		mapControlsDetailsDiv.appendChild(saveMapDiv);
		var mapDiv = document.createElement('div');
		mapDiv.id = 'mapDiv';
		pageContents.push(mapDiv);
		var mapSVG = document.createElementNS('http://www.w3.org/2000/svg','svg');
		mapSVG.id = 'mapSVG';
		mapDiv.appendChild(mapSVG);
		
	
		return pageContents;
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
	
	toggleMap: function(type) {
		for (var i of ['biome','physical','plates','states']) {
			document.getElementById(i+'Group').setAttribute('visibility','hidden');
		};
		if (type == 'biome') {
			document.getElementById('biomeGroup').setAttribute('visibility','visible');
		} else if (type == 'physical') {
			document.getElementById('physicalGroup').setAttribute('visibility','visible');
		} else if (type == 'plates') {
			document.getElementById('physicalGroup').setAttribute('visibility','visible');
			document.getElementById('platesGroup').setAttribute('visibility','visible');
		} else if (type = 'political') {
			document.getElementById('physicalGroup').setAttribute('visibility','visible');
			document.getElementById('statesGroup').setAttribute('visibility','visible');
		};
	},

	compileMap: function(map) {
		view.map = map;
		
		detailsDiv = document.getElementById('detailsDiv').innerHTML = ''

		var mapSVG = document.getElementById('mapSVG');
		mapSVG.innerHTML = '';
		var viewBoxString = view.currentZoom.viewBox.minX + ' ' + view.currentZoom.viewBox.minY + ' ' + view.currentZoom.viewBox.width + ' ' + view.currentZoom.viewBox.height;
		mapSVG.setAttribute('viewBox',viewBoxString);
				
		mapSVG.addEventListener('mousedown',view.mapDragStart);
		mapSVG.addEventListener('mousemove',view.mapDragGo);
		mapSVG.addEventListener('mouseup',view.mapDragEnd);
		mapSVG.addEventListener('mouseleave',view.mapDragEnd);

		mapSVG.addEventListener('wheel',view.zoom);
		
		var defs = document.createElementNS('http://www.w3.org/2000/svg','defs');
		mapSVG.appendChild(defs);
		var marker = document.createElementNS('http://www.w3.org/2000/svg','marker');
		defs.appendChild(marker);
		marker.setAttribute('id','arrowhead');
		marker.setAttribute('viewBox','0 0 5 5');
		marker.setAttribute('refX',1);
		marker.setAttribute('refY',2.5);
		marker.setAttribute('markerWidth',2);
		marker.setAttribute('markerHeight',2);
		marker.setAttribute('orient','auto');
		var path = document.createElementNS('http://www.w3.org/2000/svg','path');
		marker.appendChild(path);
		path.setAttribute('d','M 0 0 L 5 2.5 L 0 5 z');
		
		var biomeGroup = document.createElementNS('http://www.w3.org/2000/svg','g');
		biomeGroup.id = 'biomeGroup';
		mapSVG.appendChild(biomeGroup);
		var physicalGroup = document.createElementNS('http://www.w3.org/2000/svg','g');
		physicalGroup.id = 'physicalGroup';
		mapSVG.appendChild(physicalGroup);
		var statesGroup = document.createElementNS('http://www.w3.org/2000/svg','g');
		statesGroup.id = 'statesGroup';
		mapSVG.appendChild(statesGroup);
		var riverGroup = document.createElementNS('http://www.w3.org/2000/svg','g');
		riverGroup.id = 'riverGroup';
		mapSVG.appendChild(riverGroup);
		var platesGroup = document.createElementNS('http://www.w3.org/2000/svg','g');
		platesGroup.id = 'platesGroup';
		platesGroup.setAttribute('visibility','hidden');
		platesGroup.setAttribute('opacity',1);
		mapSVG.appendChild(platesGroup);
		var languagesGroup = document.createElementNS('http://www.w3.org/2000/svg','g');
		languagesGroup.id = 'languagesGroup';
		languagesGroup.setAttribute('visibility','hidden');
		languagesGroup.setAttribute('opacity',0.5);
		mapSVG.appendChild(languagesGroup);
		var highlightGroup = document.createElementNS('http://www.w3.org/2000/svg','g');
		highlightGroup.id = 'highlightGroup';
		mapSVG.appendChild(highlightGroup);
		var uiGroup = document.createElementNS('http://www.w3.org/2000/svg','g');
		uiGroup.id = 'uiGroup';
		mapSVG.appendChild(uiGroup);
		
		for (tile of map.tiles) {
			for (var tileType of ['biome','physical','states']) {
				var polygon = document.createElementNS('http://www.w3.org/2000/svg','polygon');
				var tileColor;
				if (tileType == 'biome') {
					tileColor = tile.biomeColor;
					biomeGroup.appendChild(polygon);
				} else if (tileType == 'physical') {
					tileColor = tile.physicalColor;
					physicalGroup.appendChild(polygon);
				} else if (tileType == 'states') {
					tileColor = 'none';
					polygon.id = 'tile_'+tile.id;
					statesGroup.appendChild(polygon);
				};
				polygon.setAttribute('fill',tileColor);
				polygon.setAttribute('stroke',tileColor);
				polygon.setAttribute('stroke-width',0.5);
				polygon.setAttribute('stroke-linejoin','round');
				var tileVertices = '';
				for (v of tile.vertices) {
					tileVertices += v.x + ',' + v.y + ' ';
				};
				polygon.setAttribute('points',tileVertices);
				polygon.addEventListener('click',handlers.displayDetails.bind(this,tile));
			};
		};
		for (var v of map.vertices) {
			var plateVector = document.createElementNS('http://www.w3.org/2000/svg','g');
			platesGroup.appendChild(plateVector);
			var circle = document.createElementNS('http://www.w3.org/2000/svg','circle');
			circle.setAttribute('cx',v.x);
			circle.setAttribute('cy',v.y);
			circle.setAttribute('r',5);
			circle.setAttribute('fill','none');
			circle.setAttribute('stroke',v.plate.color);
			plateVector.appendChild(circle);
			var line = document.createElementNS('http://www.w3.org/2000/svg','line');
			line.setAttribute('x1',v.x - v.plate.dx * 5);
			line.setAttribute('y1',v.y - v.plate.dy * 5);
			line.setAttribute('x2',v.x + v.plate.dx * 5);
			line.setAttribute('y2',v.y + v.plate.dy * 5);
			line.setAttribute('marker-end','url(#arrowhead)');
			line.setAttribute('stroke','black');
			line.setAttribute('stroke-width',2);
			plateVector.appendChild(line);
			var scaleFactor = map.step/12;
			plateVector.setAttribute('transform','translate('+(-v.x*(scaleFactor-1))+','+(-v.y*(scaleFactor-1))+') scale('+scaleFactor+')');
		};
// 		if (view.focus.tile !== undefined) {
// 			for (var n of view.focus.tile.adjacent) {
// 				var polygon = document.createElementNS('http://www.w3.org/2000/svg','polygon');
// 				polygon.setAttribute('fill','none');
// 				polygon.setAttribute('stroke','yellow');
// 				polygon.setAttribute('stroke-linejoin','round');
// 				var tileVertices = '';
// 				for (v of n.vertices) {
// 					tileVertices += v.x + ',' + v.y + ' ';
// 				};
// 				polygon.setAttribute('points',tileVertices);
// 				mapSVG.appendChild(polygon);
// 			var polygon = document.createElementNS('http://www.w3.org/2000/svg','polygon');
// 			polygon.setAttribute('fill','none');
// 			polygon.setAttribute('stroke','red');
// 			polygon.setAttribute('stroke-linejoin','round');
// 			var tileVertices = '';
// 			for (v of view.focus.tile.vertices) {
// 				tileVertices += v.x + ',' + v.y + ' ';
// 			};
// 			polygon.setAttribute('points',tileVertices);
// 			mapSVG.appendChild(polygon);
// 			};
// 		};
		for (var edge of map.edges) {
			if ((edge.drainage > 0 || edge.topVertex.z == edge.bottomVertex.z) && (edge.topVertex.y > map.sizeY * 0.01 && edge.topVertex.y < map.sizeY * 0.99)) {
				var line = document.createElementNS('http://www.w3.org/2000/svg','line');
				var edgeTemperature;
				if (edge.tiles[0] !== undefined && edge.tiles[1] !== undefined) {
					edgeTemperature = (edge.tiles[0].temperature+edge.tiles[1].temperature)/2
				} else if (edge.tiles[0] !== undefined) {
					edgeTemperature = edge.tiles[0].temperature;
				} else if (edge.tiles[0] !== undefined) {
					edgeTemperature = edge.tiles[1].temperature;
				} else {
					edgeTemperature = 100;
				};
				var light = Math.min(Math.max(66,edgeTemperature * -3 + 90),90);
				var hue = 200, saturation = 40;
				line.setAttribute('stroke','hsl('+hue+','+saturation+'%,'+light+'%)');
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
					riverGroup.appendChild(line);
				};
				if (edge.topVertex.z !== 0 && edge.topVertex.z == edge.bottomVertex.z) { // basin edge
					line.setAttribute('stroke-width',view.riverWidth(edge.bottomVertex.downhill.drainage,map));
					line.setAttribute('x1',edge.topVertex.x);
					line.setAttribute('y1',edge.topVertex.y);
					riverGroup.appendChild(line);
				};
			};
		};
// 		for (tile of map.tiles) {
// 			if (tile.populations !== undefined) {
// 				var circle = document.createElementNS('http://www.w3.org/2000/svg','circle');
// 				circle.setAttribute('cx',tile.x);
// 				circle.setAttribute('cy',tile.y);
// 				circle.setAttribute('r',5);
// 				circle.setAttribute('fill',tile.populations[0].languages[0].language.color);
// 				languagesGroup.appendChild(circle);
// 			};
// 		};
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
	},
	
// 	colorStateTile: function(tileID,state) {
// 		var tile = document.getElementById('tile_'+tileID);
// 		if (state == undefined) {state = {color:'none'};};
// 		tile.setAttribute('fill',state.color);
// 		tile.setAttribute('stroke',state.color);
// 	},
	
	colorStateTile: function(tile) {
		var color;
		var polygon = document.getElementById('tile_'+tile.id);
		var highestLoyalty = 0;
		var loyalToState = undefined;
		for (var pop of tile.populations) {
			for (var entry of pop.states) {
				if (entry.loyalty > highestLoyalty) {
					highestLoyalty = entry.loyalty;
					loyalToState = entry.state;
				}
			};
		};
		if (loyalToState == undefined) {
			color = 'none';
		} else {
			color = loyalToState.color;
		};
		polygon.setAttribute('fill',color);
		polygon.setAttribute('stroke',color);
	},
	
	riverWidth: function(drainage,map) {
		return Math.min(drainage * 0.0075 * map.step,map.step * 0.25);
	},
	
	details: {
		mapControls: false,
	},
	
	toggleDetails: function(section) {
		var div = document.getElementById(section+'DetailsDiv');
		if (view.details[section] == undefined) {
			view.details[section] = false;
			div.style.display = 'none';
		} else if (view.details[section]) {
			view.details[section] = false;
			div.style.display = 'none';
		} else {
			view.details[section] = true;
			div.style.display = 'block';
		};
	},
	
	displayCursor: function(tile) {
		var uiGroup = document.getElementById('uiGroup');
		uiGroup.innerHTML = '';
		for (var n of view.focus.tile.adjacent) {
			var polygon = document.createElementNS('http://www.w3.org/2000/svg','polygon');
			polygon.setAttribute('fill','none');
			polygon.setAttribute('stroke','yellow');
			polygon.setAttribute('stroke-linejoin','round');
			var tileVertices = '';
			for (v of n.vertices) {
				tileVertices += v.x + ',' + v.y + ' ';
			};
			polygon.setAttribute('points',tileVertices);
			uiGroup.appendChild(polygon);
		var polygon = document.createElementNS('http://www.w3.org/2000/svg','polygon');
		polygon.setAttribute('fill','none');
		polygon.setAttribute('stroke','red');
		polygon.setAttribute('stroke-linejoin','round');
		var tileVertices = '';
		for (v of view.focus.tile.vertices) {
			tileVertices += v.x + ',' + v.y + ' ';
		};
		polygon.setAttribute('points',tileVertices);
		uiGroup.appendChild(polygon);
		};
	},
	
	displayDetails: function(tile) {
		view.focus.tile = tile;
		view.displayCursor(tile);
		var detailsDiv = document.getElementById('detailsDiv');
		detailsDiv.innerHTML = '';
		
		// Geography
		var geographyDiv = document.createElement('div');
		detailsDiv.appendChild(geographyDiv);
		var geographyHead = document.createElement('h3');
		geographyHead.innerHTML = 'Geography';
		geographyHead.setAttribute('onclick','handlers.toggleDetails("geography")');
		geographyDiv.appendChild(geographyHead);
		var geographyDetailsDiv = document.createElement('div');
		geographyDetailsDiv.id = 'geographyDetailsDiv';
		geographyDiv.appendChild(geographyDetailsDiv);
		var longitude = 360 * (map.sizeX / 2 - tile.x)/map.sizeX;
		var coordinatesP = document.createElement('p');
		coordinatesP.innerHTML = "Coordinates: " + tile.coordinates;
		geographyDetailsDiv.appendChild(coordinatesP);
		var elevationP = document.createElement('p');
		if (tile.z > 0) {
			elevationP.innerHTML = 'Elevation: ';
		} else {
			elevationP.innerHTML = 'Depth: ';
		};
		elevationP.innerHTML += Math.round(tile.z * 500) + 'm';
		geographyDetailsDiv.appendChild(elevationP);
		var pressureP = document.createElement('p');
		pressureP.innerHTML = "Atmo Pressure: " + Math.round(1000 + tile.pressure * 100) + 'hPa';
		geographyDetailsDiv.appendChild(pressureP);
		var precipitationP = document.createElement('p');
		precipitationP.innerHTML = "Precipitation: " + Math.round(tile.precipitation*100)/100 + 'mm/day (avg)';
		geographyDetailsDiv.appendChild(precipitationP);
		var temperatureP = document.createElement('p');
		temperatureP.innerHTML = "Temperature: " + Math.round(tile.temperature*100)/100 + ' celsius';
		geographyDetailsDiv.appendChild(temperatureP);
		var biomeP = document.createElement('p');
		biomeP.innerHTML = "Biome: " + tile.biome;
		geographyDetailsDiv.appendChild(biomeP);
		
		// People
		if (tile.populations !== undefined) {
			var states = [];
			var peopleDiv = document.createElement('div');
			detailsDiv.appendChild(peopleDiv);
			var peopleHead = document.createElement('h3');
			peopleHead.innerHTML = "People";
			peopleHead.setAttribute('onclick','handlers.toggleDetails("people")');
			peopleDiv.appendChild(peopleHead);
			var peopleDetailsDiv = document.createElement('div');
			peopleDetailsDiv.id = 'peopleDetailsDiv';
			peopleDiv.appendChild(peopleDetailsDiv);
			for (var population of tile.populations) {
				if (population.name !== undefined) {
				};
				var societyP = document.createElement('p');
				peopleDetailsDiv.appendChild(societyP);
				societyP.innerHTML = population.socialStructure + ' ' + population.foodCulture + ' society';
				societyP.addEventListener('mouseover',view.displayHighlights.bind(view,population.range()));
				var populationP = document.createElement('p');
				peopleDetailsDiv.appendChild(populationP);
				populationP.innerHTML = 'Population: ' + population.population;
				if (population.livestock.length > 0) {
					var livestockP = document.createElement('p');
					livestockP.innerHTML = "Livestock: ";
					peopleDetailsDiv.appendChild(livestockP);
					for (var livestock of population.livestock) {
						livestockP.innerHTML += livestock.name + " (" + livestock.use + "), ";
					};
				};
				if (population.crops.length > 0) {
					var cropsP = document.createElement('p');
					cropsP.innerHTML = "Crops: ";
					peopleDetailsDiv.appendChild(cropsP);
					for (var crop of population.crops) {
						cropsP.innerHTML += crop.name + " (" + crop.use + "), ";
					};
				};
				var languagesP = document.createElement('p');
				languagesP.innerHTML = "Languages: ";
				for (var language of population.languages) {
					languagesP.innerHTML += language.language.name + " (" +Math.round(language.percentage*10000)/100+ "%) ";
				};
				peopleDetailsDiv.appendChild(languagesP);
				var conventionsP = document.createElement('p');
				conventionsP.innerHTML = "Cultural Conventions: ";
				var ranking = population.ranking();
				var conventionList = [];
				for (var target of ranking) {
					for (var entry of population.conventions) {
						if (entry.convention.target.replace(/ /g,"_") == target) {
							conventionList.push(entry);
						};
					};
				};
				for (var convention of conventionList) {
					conventionsP.innerHTML += '<br/>' + convention.convention.string + " ("+Math.round(convention.strength*10)+")";
				};
				peopleDetailsDiv.appendChild(conventionsP);
				for (var entry of population.states) {
					if (states.indexOf(entry.state) == -1) {
						states.push(entry.state);
					};
				};
			};
			
			// States
			if (states.length > 0) {
				var statesDiv = document.createElement('div');
				detailsDiv.appendChild(statesDiv);
				var statesHead = document.createElement('h3');
				statesHead.innerHTML = 'State';
				if (states.length > 1) {statesHead.innerHTML += 's';};
				statesHead.setAttribute('onclick','handlers.toggleDetails("states")');
				statesDiv.appendChild(statesHead);
				var statesDetailsDiv = document.createElement('div');
				statesDetailsDiv.id = 'statesDetailsDiv';
				statesDiv.appendChild(statesDetailsDiv);
				for (var state of states) {
					var stateDiv = document.createElement('div');
					statesDetailsDiv.appendChild(stateDiv);
					stateDiv.style.borderLeft = '10px solid ' + state.color;
					var nameP = document.createElement('p');
					nameP.innerHTML = state.name;
					stateDiv.appendChild(nameP);
					var stabilityP = document.createElement('p');
					stabilityP.innerHTML = 'Stability: UNKNOWN';
					stateDiv.appendChild(stabilityP);
					var taxP = document.createElement('p');
					taxP.innerHTML = 'Tax Rate: ' + Math.round(state.tax*100) + '%';
					stateDiv.appendChild(taxP);
					var treasuryP = document.createElement('p');
					treasuryP.innerHTML = 'Treasury: ' + Math.round(state.treasury) + ' units';
					stateDiv.appendChild(treasuryP);
					var forcesP = document.createElement('p');
					forcesP.innerHTML = 'Military Force: ' + Math.round(state.force());
					stateDiv.appendChild(forcesP);
				};
			};
		};
		
		// maintain detail display preferences
		for (var section in view.details) {
			if (view.details[section] == false) {
				var div = document.getElementById(section+'DetailsDiv');
				if (div) {
					div.style.display = 'none';
				};
			};
		}
	},
	
	displayEvents: function(eventList) {
		var generationsDiv = document.getElementById('generationsDiv');
		var nextGenerationDiv = document.createElement('div');
		nextGenerationDiv.id = 'generation'+(map.history.record.length+1)+'Div';
		nextGenerationDiv.className = 'nextGenerationDiv';
		generationsDiv.appendChild(nextGenerationDiv);
		var highlights = [];
		if (eventList.length == 0) {
			eventList = [new Event()];
		};
		for (var entry of eventList) {
			var eventP = document.createElement('p');
			eventP.innerHTML = entry.displayString();
			eventP.addEventListener('mouseover',view.displayHighlights.bind(this,entry.tiles));
			nextGenerationDiv.appendChild(eventP);
			if (entry.tiles !== undefined) {highlights = highlights.concat(entry.tiles);};
		};
		generationsDiv.scrollTop = generationsDiv.scrollHeight;
		view.displayHighlights(highlights);
	},
	
	displayHighlights: function(highlights) {
		if (highlights.length > 0 && highlights[0] !== undefined) {
			var highlightGroup = document.getElementById('highlightGroup');
			highlightGroup.innerHTML = '';
			for (var tile of highlights) {
				var polygon = document.createElementNS('http://www.w3.org/2000/svg','polygon');
				polygon.setAttribute('fill','none');
				polygon.setAttribute('stroke','cyan');
				polygon.setAttribute('stroke-linejoin','round');
				var tileVertices = '';
				for (v of tile.vertices) {
					tileVertices += v.x + ',' + v.y + ' ';
				};
				polygon.setAttribute('points',tileVertices);
				highlightGroup.appendChild(polygon);
			};
		};
	},
	
	displayVertex: function(v) {
		console.log(v);
		view.focus.vertex = v;
		view.compileMap(map);
	},
};

