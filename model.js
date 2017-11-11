function Map(sizeX,sizeY,step,impacts,tectonics,wetness,orbit,topLatitude,bottomLatitude) {
	if (sizeX == undefined) {sizeX = 1000};
	if (sizeY == undefined) {sizeY = sizeX * 0.6};
	if (step == undefined) {step = 10};
	this.sizeX = sizeX;
	this.sizeY = sizeY;
	this.step = step;
	if (topLatitude == undefined) {topLatitude = 90};
	if (bottomLatitude == undefined) {bottomLatitude = -90};
	this.verticesArray = [];
	this.vertices = [];
	this.edges = [];
	this.edgeLibrary = {};
	this.tiles = [];
	this.basins = [];
	this.populations = [];
	this.species = [];
	this.faiths = [];
	this.states = [];
	this.history = new History();
	var i, x, y;
	
	if (impacts == undefined) {impacts = 5;};
	this.impactsFactor = impacts;
	
	if (tectonics == undefined) {tectonics = 5;};
	this.tectonicsFactor = tectonics;
	
	if (wetness == undefined) {wetness = 5;};
	this.wetnessFactor = wetness;
	
	if (orbit == undefined) {orbit = 5;};
	this.orbitFactor = orbit;

	// Random Seed Vertices
	for (var x=step;x<sizeX;x+=step) {
		for (var y=step;y<sizeY;y+=step) {
			this.verticesArray.push([x+Math.random()*step*0.9,y+Math.random()*step*0.9]);
		};
	};
	for (x=0;x<sizeX;x+=step) {
		this.verticesArray.push([x,0]);
		this.verticesArray.push([x,sizeY]);
	}
	for (y=0;y<sizeY;y+=step) {
		this.verticesArray.push([0,y]);
		this.verticesArray.push([sizeX,y]);
	};

	this.triangulate = function() {
		this.triangles = Delaunay.triangulate(this.verticesArray);
	};
	
	this.compileTiles = function() {
		// Turn Vertices from Arrays into Objects (and add seed z)
		for (var i in this.verticesArray) {
			if (this.verticesArray[i][0] == sizeX) {
				this.vertices[i] = {
					x: this.verticesArray[i][0],
					y: this.verticesArray[i][1],
					z: this.vertices[i-1].z,
					edgeLibrary: {},
					index: i,
				};
			} else {
				this.vertices[i] = {
					x: this.verticesArray[i][0],
					y: this.verticesArray[i][1],
					z: Math.random() * 0.0625 - 0.125,
					edgeLibrary: {},
					index: i,
				};
			};
		};

		for (i = this.triangles.length; i; ) {
			var newTile = new Tile();
			var vertexIndices = [];
			--i;newTile.vertices.push(this.vertices[this.triangles[i]]);vertexIndices.push(this.triangles[i]);
			--i;newTile.vertices.push(this.vertices[this.triangles[i]]);vertexIndices.push(this.triangles[i]);
			--i;newTile.vertices.push(this.vertices[this.triangles[i]]);vertexIndices.push(this.triangles[i]);
			this.tiles.push(newTile);
			newTile.id = this.tiles.length;
			vertexIndices.sort();
			if (this.edgeLibrary['edgeA'+vertexIndices[0]+'B'+vertexIndices[1]] == undefined) {
				this.edgeLibrary['edgeA'+vertexIndices[0]+'B'+vertexIndices[1]] = {vertices:[this.vertices[vertexIndices[0]],this.vertices[vertexIndices[1]]],tiles:[newTile]};
			} else {
				this.edgeLibrary['edgeA'+vertexIndices[0]+'B'+vertexIndices[1]].tiles.push(newTile);
			};
			if (this.edgeLibrary['edgeA'+vertexIndices[0]+'B'+vertexIndices[2]] == undefined) {
				this.edgeLibrary['edgeA'+vertexIndices[0]+'B'+vertexIndices[2]] = {vertices:[this.vertices[vertexIndices[0]],this.vertices[vertexIndices[2]]],tiles:[newTile]};
			} else {
				this.edgeLibrary['edgeA'+vertexIndices[0]+'B'+vertexIndices[2]].tiles.push(newTile);
			};
			if (this.edgeLibrary['edgeA'+vertexIndices[1]+'B'+vertexIndices[2]] == undefined) {
				this.edgeLibrary['edgeA'+vertexIndices[1]+'B'+vertexIndices[2]] = {vertices:[this.vertices[vertexIndices[1]],this.vertices[vertexIndices[2]]],tiles:[newTile]};
			} else {
				this.edgeLibrary['edgeA'+vertexIndices[1]+'B'+vertexIndices[2]].tiles.push(newTile);
			};
			newTile.edges = ['edgeA'+vertexIndices[0]+'B'+vertexIndices[1],'edgeA'+vertexIndices[0]+'B'+vertexIndices[2],'edgeA'+vertexIndices[1]+'B'+vertexIndices[2]];
			this.vertices[vertexIndices[0]].edgeLibrary['edgeA'+vertexIndices[0]+'B'+vertexIndices[1]] = true;
			this.vertices[vertexIndices[0]].edgeLibrary['edgeA'+vertexIndices[0]+'B'+vertexIndices[2]] = true;
			this.vertices[vertexIndices[1]].edgeLibrary['edgeA'+vertexIndices[0]+'B'+vertexIndices[1]] = true;
			this.vertices[vertexIndices[1]].edgeLibrary['edgeA'+vertexIndices[1]+'B'+vertexIndices[2]] = true;
			this.vertices[vertexIndices[2]].edgeLibrary['edgeA'+vertexIndices[0]+'B'+vertexIndices[2]] = true;
			this.vertices[vertexIndices[2]].edgeLibrary['edgeA'+vertexIndices[1]+'B'+vertexIndices[2]] = true;
		};
		for (var tile of this.tiles) {
			for (e in tile.edges) {
				tile.edges[e] = this.edgeLibrary[tile.edges[e]];
			};
			tile.cx = (tile.vertices[0].x+tile.vertices[1].x+tile.vertices[2].x)/3;
			tile.cy = (tile.vertices[0].y+tile.vertices[1].y+tile.vertices[2].y)/3;
			tile.cy = Math.max(Math.min(tile.cy,this.sizeY),0);
			tile.latitude = Math.asin((this.sizeY - 2 * tile.cy)/this.sizeY) * 180/Math.PI;
			tile.longitude = 360 * (this.sizeX / 2 - tile.cx)/this.sizeX;
			var ns = 'N', ew = 'E';
			if (tile.latitude < 0) {ns = 'S';};
			if (tile.longitude < 0) {ew = 'W';};
			tile.coordinates = '('+Math.abs(Math.round(tile.latitude))+'&#176;'+ns+', '+Math.abs(Math.round(tile.longitude))+'&#176;'+ew+')';
		};
		for (name in this.edgeLibrary) {
			this.edges.push(this.edgeLibrary[name]);
		};
		for (v of this.vertices) {
			v.edges = [];
			for (edgeName in v.edgeLibrary) {
				v.edges.push(this.edgeLibrary[edgeName]);
			};
		};
	};

	this.neighbors = function() {
		for (tile of this.tiles) {
			tile.neighbors = [];
			tile.adjacent = [];
			for (var e of tile.edges) {
				for (var t of e.tiles) {
					if (t !== tile) {
						tile.neighbors.push(t);
					};
				};
			};
			// vertices' edges' tiles
			for (var v of tile.vertices) {
				for (var e of v.edges) {
					for (t of e.tiles) {
						if (t !== tile && tile.adjacent.indexOf(t) == -1) {
							tile.adjacent.push(t);
						};
					};
				};
			};
		};
	};
	
	this.impacts = function() {
		var impacts = [];
		for (var i=0;i< (this.sizeX/this.step) * (this.sizeY/this.step) * 0.001 * this.impactsFactor;i++) {
			var impact = {
				cx: Math.random() * this.sizeX,
				cy: Math.random() * this.sizeY,
				r: (Math.random()/2 + 0.5) * Math.min(this.sizeX,this.sizeY) * 0.25,
				dz: 4 * Math.random() - 2,
			};
			impact.c2x = impact.cx + Math.random() * impact.r - impact.r/2;
			impact.c2y = impact.cy + Math.random() * impact.r - impact.r/2;
			impact.r2 = impact.r * Math.random() * 0.9;
			impacts.push(impact);
			if (impact.cx < this.sizeX * 0.05 || impact.cx > this.sizeX * 0.95 || impact.cy < 0 || impact.cy > this.sizeY) {
				impact.dz = -1 * Math.abs(impact.dz);
			};
		};
		var mirrorimpacts = []; // To wrap around date line
		for (var impact of impacts) {
			var p1 = {
				cx: impact.cx + this.sizeX,
				cy: impact.cy,
				r: impact.r,
				dz: impact.dz,
				c2x: impact.c2x,
				c2y: impact.c2y,
				r2: impact.r2,
			};
			var p2 = {
				cx: impact.cx - this.sizeX,
				cy: impact.cy,
				r: impact.r,
				dz: impact.dz,
				c2x: impact.c2x,
				c2y: impact.c2y,
				r2: impact.r2,
			};
			mirrorimpacts.push(p1);
			mirrorimpacts.push(p2);
		};
		impacts = impacts.concat(mirrorimpacts);
		for (var impact of impacts) {
			for (v of this.vertices) {
				if (Math.pow(Math.pow(v.x - impact.cx,2)+Math.pow(v.y - impact.cy,2),0.5) < impact.r) {
					if ((Math.pow(Math.pow(v.x - impact.c2x,2)+Math.pow(v.y - impact.c2y,2),0.5) > impact.r2)) {
						v.z += impact.dz;
					};
				};
			};
		};
	};
	
	this.tectonics = function() {
		var plates = [];
		for (var i=0;i<10*this.tectonicsFactor;i++) {
			var plate = {
				x: Math.random() * this.sizeX,
				y: Math.random() * Math.random() * this.sizeY * 0.5 + this.sizeY * 0.5,
				z: Math.random() - 0.5,
				size: Math.random() * Math.random() * Math.random() * 7 + 1,
				dx: (Math.random() - 0.5) * this.tectonicsFactor/5,
				dy: (Math.random() - 0.5) * this.tectonicsFactor/5,
				vertices: [],
				color: 'rgb('+(20 + Math.random() * 80)+'%, '+(20 + Math.random() * 80)+'%, '+(20 + Math.random() * 80)+'%)',
			};
			if (Math.random() > 0.5) {
				plate.y = this.sizeY - plate.y;
			};
			if (plate.x < this.sizeX * 0.1 || plate.x > this.sizeX * 0.9) {
				plate.z = -1 * Math.abs(plate.z);
			} else if (i % 3 == 0) {
				plate.z = Math.abs(plate.z);
			} else {
				plate.z = -1 * Math.abs(plate.z);
			};
			plates.push(plate);
		};
		for (var vertex of this.vertices) {
			var nearest = Infinity;
			var nearestCenter = undefined;
			for (var plate of plates) {
				var distance = plate.size * Math.pow(Math.pow(vertex.x - plate.x,2) + Math.pow(vertex.y - plate.y,2),0.5);
				var wrapEastDistance = plate.size * Math.pow(Math.pow(vertex.x - plate.x + this.sizeX,2) + Math.pow(vertex.y - plate.y,2),0.5);
				var wrapWestDistance = plate.size * Math.pow(Math.pow(vertex.x - plate.x - this.sizeX,2) + Math.pow(vertex.y - plate.y,2),0.5);
				var distance = Math.min(distance,wrapEastDistance,wrapWestDistance);
				if (distance < nearest) {
					nearest = distance;
					nearestCenter = plate;
				};
			};
			vertex.plate = nearestCenter;
			vertex.z += vertex.plate.z;
			nearestCenter.vertices.push(vertex);
		};
		for (var vertex of this.vertices) {
			var crumpleDistance = Math.min(this.sizeX,this.sizeY) * 0.2;
			for (var e of vertex.edges) {
				if (e.vertices[0].plate !== e.vertices[1].plate) {
					var plates = [e.vertices[0].plate,e.vertices[1].plate];
					var centerDistance = Math.pow(Math.pow(plates[0].x - plates[1].x,2) + Math.pow(plates[0].y - plates[1].y,2),0.5);
					var motionDistance = Math.pow(Math.pow(plates[0].x+plates[0].dx - plates[1].x+plates[1].dx,2) + Math.pow(plates[0].y+plates[0].dy - plates[1].y+plates[1].dy,2),0.5);
					var zChange = centerDistance - motionDistance;
					for (var potential of vertex.plate.vertices) {
						distance = Math.pow(Math.pow(potential.x - vertex.x,2)+Math.pow(potential.y - vertex.y,2),0.5);
						if (distance < crumpleDistance) {
							potential.z += zChange * (crumpleDistance - distance) / crumpleDistance * Math.pow(this.step,2)/100;
						};
					};
				};
			};
		};
		for (var tile of this.tiles) {
			tile.x = (tile.vertices[0].x+tile.vertices[1].x+tile.vertices[2].x)/3;
			tile.y = (tile.vertices[0].y+tile.vertices[1].y+tile.vertices[2].y)/3;
			tile.z = (tile.vertices[0].z+tile.vertices[1].z+tile.vertices[2].z)/3;
		};
	};
	
	this.findTopsAndBottoms = function() {
		// Define top and bottom vertices
		for (edge of this.edges) {
			if (edge.vertices[0].z > edge.vertices[1].z) {
				edge.topVertex = edge.vertices[0];
				edge.bottomVertex = edge.vertices[1];
			} else {
				edge.topVertex = edge.vertices[1];
				edge.bottomVertex = edge.vertices[0];
			};
			edge.drainage = 0;
		};
	};
	
	this.coastlines = function() {
		this.findTopsAndBottoms();
		for (var tile of this.tiles) {
			tile.height = (tile.vertices[0].z+tile.vertices[1].z+tile.vertices[2].z)/3;
		};
		for (var tile of this.tiles) {
			var coastline = false;
			if (tile.height > 0) {
				for (var n of tile.neighbors) {
					if (n.height < 0) {
						coastline = true;
					};
				};
				if (coastline) {
					for (var v of tile.vertices) {
						v.z = Math.min(v.z,0);
					};
				};
			};
			tile.height = (tile.vertices[0].z+tile.vertices[1].z+tile.vertices[2].z)/3;
		};
		for (var v of this.vertices) {
			if (v.z < 0) {
				var pit = true;
				for (var edge of v.edges) {
					if (edge.vertices[0].z < 0 && edge.vertices[1].z < 0) {
						pit = false;
					};
				};
				if (pit) {
					v.z = 0.1 * Math.random();
				} else {
					var total = 0;
					for (var edge of v.edges) {
						total += edge.vertices[0].z + edge.vertices[1].z;
					};
					v.z = total/(v.edges.length*2);
				};
			};
		};
	};
	
	this.fillBasins = function() {
		var basinCount = 0;
		this.findTopsAndBottoms();
		for (var v of this.vertices) {
			if (v.z > 0) {
				// Does it have a downhill edge or is it part of a basin?
				v.basin = true,v.downhill = false;
				for (var e of v.edges) {
					if (e.bottomVertex.z < v.z) {
						v.downhill = true;
						v.basin = false;
					};
				};
				if (v.basin) {
					v.basin = [];
					for (var potential of this.vertices) {
						if (potential.z == v.z) {
							v.basin.push(potential);
						};
					};
					var lowestZ = Infinity;
					var lowestEdge = undefined;
					for (var b of v.basin) {
						for (var e of b.edges) {
							if (v.basin.indexOf(e.topVertex) == -1 && e.topVertex.z < lowestZ) {
								lowestZ = e.topVertex.z;
								lowestEdge = e;
							} else if (v.basin.indexOf(e.bottomVertex) == -1 && e.bottomVertex.z < lowestZ) {
								lowestZ = e.bottomVertex.z;
								lowestEdge = e;
							};
						};
					};
					if (lowestEdge == undefined) {
// 						console.log('no lowest vertex?');
					} else if ( (lowestEdge.vertices[0].z + lowestEdge.vertices[1].z) / 2 < v.z) {
						for (var b of v.basin) {
							b.downhill = lowestEdge;
						};
					} else {
						for (var b of v.basin) {
							b.z = lowestEdge.topVertex.z;
						};
						basinCount++;
					};
				} else if (v.downhill) {
					var lowestZ = v.z;
					var lowestEdge = undefined;
					for (var e of v.edges) {
						if (e.bottomVertex.z < lowestZ) {
							lowestZ = e.bottomVertex.z;
							lowestEdge = e;
						};
					};
					v.downhill = lowestEdge;
					lowestEdge.tributaries = true;
				};
			};
		};
		return basinCount;
	};
	
	this.precipitation = function() {
		for (tile of this.tiles) {
			tile.z = (tile.vertices[0].z + tile.vertices[1].z + tile.vertices[2].z)/3;
			tile.pressure = -1 * Math.cos(6 * tile.latitude * Math.PI / 180);
			if (tile.z > 0) { // elevation creates thermal lows
				tile.pressure = (tile.pressure * (10 - tile.z) - tile.z)/10;
			};
			tile.precipitation = Math.max(0,(1 + tile.pressure) * 3);
			var coastal = false, lakeside = false;
			for (var n of tile.adjacent) {
				if (n.z < 0) {
					coastal = true;
				};
			};
			for (var n of tile.adjacent) {
				if (n.vertices[0].z == n.vertices[1].z && n.vertices[2].z == n.vertices[1].z) {
					lakeside = true;
				};
			};
			if (coastal || lakeside) {tile.precipitation += 1.5};
			tile.precipitation *= this.wetnessFactor/5;
		};
	};
	
	this.temperature = function() {
		for (tile of this.tiles) {
			tile.temperature = 30 - Math.abs(tile.latitude * 0.5);
			tile.temperature += -4*this.orbitFactor + 20;
			if (tile.z > 0) {
				tile.temperature -= tile.z * 0.5;
			} else {
				tile.temperature -= tile.z;
				if (tile.temperature < -2) {
					for (var v of tile.vertices) {
						v.z = Math.random() * 0.1;
					};
					tile.ice = true;
					tile.precipitation = 0;
				};
			};
		};
	};
	
	this.hydrology = function() {
		this.findTopsAndBottoms();
		// Find downhill for tiles
		for (tile of this.tiles) {
			tile.z = (tile.vertices[0].z + tile.vertices[1].z + tile.vertices[2].z)/3;
		};
		for (tile of this.tiles) {
			if (tile.vertices[0].z > tile.vertices[1].z && tile.vertices[0].z > tile.vertices[2].z) {
				tile.downhill = this.edgeLibrary['edgeA'+tile.vertices[1].index+'B'+tile.vertices[2].index];
			} else if (tile.vertices[1].z > tile.vertices[2].z && tile.vertices[1].z > tile.vertices[0].z) {
				tile.downhill = this.edgeLibrary['edgeA'+tile.vertices[0].index+'B'+tile.vertices[2].index];
			} else {
				tile.downhill = this.edgeLibrary['edgeA'+tile.vertices[1].index+'B'+tile.vertices[0].index];
			};
		};
		// Flow drainage from tiles to downhill edges
		for (tile of this.tiles) {
			if (tile.downhill !== undefined && tile.z > 0 && tile.temperature > -2) {
				tile.downhill.drainage += tile.precipitation;
			};
		};
		// Flow drainage down edge network
		this.edges.sort((a, b) => a.topVertex.z !== b.topVertex.z ? a.topVertex.z < b.topVertex.z ? 1 : -1 : 0);
		for (edge of this.edges) {
			if (edge.bottomVertex.downhill !== undefined) {
				edge.bottomVertex.downhill.drainage += edge.drainage;
			};
		};
	};
	
	this.biome = function() {
		for (var tile of this.tiles) {
			if (tile.z <= 0) {
				tile.biome = 'ocean';
				tile.biomeColor = 'blue';
			} else if (tile.vertices[0].z == tile.vertices[1].z && tile.vertices[1].z == tile.vertices[2].z) {
				tile.biome = 'lake';
				tile.biomeColor = 'rgb(50%,50%,100%)';
			} else if (tile.temperature < -5) {
				tile.biome = 'tundra';
				tile.biomeColor = 'ghostwhite';
			} else if (tile.temperature < 5 && tile.precipitation > 0.15) {
				tile.biome = 'taiga';
				tile.biomeColor = 'darkseagreen';
			} else if (tile.temperature < 5 && tile.precipitation > 0.05) {
				tile.biome = 'grassland';
				tile.biomeColor = 'yellowgreen';
			} else if (tile.temperature < 5 && tile.precipitation <= 0.05) {
				tile.biome = 'desert';
				tile.biomeColor = 'cornsilk';
			} else if (tile.temperature < 20 && tile.precipitation > 0.7) {
				tile.biome = 'temperate rainforest';
				tile.biomeColor = 'forestgreen';
			} else if (tile.temperature < 20 && tile.precipitation > 0.35) {
				tile.biome = 'temperate forest';
				tile.biomeColor = 'darkgreen';
			} else if (tile.temperature < 20 && tile.precipitation > 0.07) {
				tile.biome = 'grassland';
				tile.biomeColor = 'yellowgreen';
			} else if (tile.temperature < 20) {
				tile.biome = 'desert';
				tile.biomeColor = 'cornsilk';
			} else if (tile.precipitation > 0.7) {
				tile.biome = 'tropical rainforest';
				tile.biomeColor = 'olivedrab';
			} else if (tile.precipitation > 0.35) {
				tile.biome = 'tropical seasonal forest';
				tile.biomeColor = 'darkolivegreen';
			} else if (tile.precipitation > 0.1) {
				tile.biome = 'savanna';
				tile.biomeColor = 'gold';
			} else {
				tile.biome = 'desert';
				tile.biomeColor = 'cornsilk';
			};
		};
	};
	
	this.physicalColor = function() {
		for (var tile of this.tiles) {
			var hue, saturation = 40, light = 50;
			if (tile.ice) {
				hue = 200, saturation = 50, light = 90;
			} else if (tile.z <= 0) {
				if (tile.temperature > -2) {
					var depth = 50 - Math.max(-5,tile.z) * -10;
					tile.physicalColor = 'rgb('+depth+'%,'+depth+'%,100%)';
				};
			} else if (tile.vertices[1].z == tile.vertices[2].z && tile.vertices[0].z == tile.vertices[2].z) {
				// basin / lake
				hue = 200;
			} else {
				hue = 55 + 10 * tile.precipitation;
			};
			if (tile.z > 0) {
				light = Math.min(Math.max(66,tile.temperature * -3 + 90),90);
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
				var slope = westVertex.z - eastVertex.z;
				tile.slope = slope;
				light += slope;
				tile.physicalColor = 'hsl('+hue+','+saturation+'%,'+light+'%)';
			};
		};
	};
	
	this.people = function() {
		var globalPopulation = 0;
		for (var tile of this.tiles) {
			if (tile.z > 0 && !tile.ice && tile.biome !== 'lake') {
				tile.populations = [new Population(tile)];
				globalPopulation += tile.populations[0].population;
			};
		};
		for (var i=0;i<100;i++) {
			map.populations[Math.random() * map.populations.length << 0].languages = [{language:new Language(),percentage:1}];
		};
		for (var i=0;i<100;i++) {
			var popsWithoutLanguage = [];
			for (var tile of map.tiles) {
				if (tile.populations !== undefined && tile.populations.length > 0) {
					if (tile.populations[0].languages.length == 0) {
						popsWithoutLanguage.push(tile.populations[0]);
					} else if (!tile.populations[0].languageSpread) {
						tile.populations[0].languageSpread = true;
						for (var neighbor of tile.neighbors) {
							if (neighbor.populations !== undefined && neighbor.populations[0].languages.length == 0) {
								neighbor.populations[0].languages.push({language:tile.populations[0].languages[0].language,percentage:1});
							};
						};
					};
				};
			};
			if (popsWithoutLanguage.length == 0) {
				i = 101;
			} else {
				popsWithoutLanguage[Math.random() * popsWithoutLanguage.length << 0].languages.push({language:new Language(),percentage:1});
			};
		};
		console.log('Global Population: ',globalPopulation);
	};
	
};

function Tile() {
	this.biome = undefined;
	this.x = undefined;
	this.y = undefined;
	this.z = undefined;
	this.vertices = [];
	this.precipitation = 0;
	this.temperature = 0;
	this.longitude = 'BOO';
// 	this.states = [];
	
	this.defense = function() {
		var stateForces = 0, partisanForces = 0;
		if (this.populations !== undefined) {
			for (var pop of this.populations) {
				partisanForces += pop.population;
				for (var entry of pop.states) {
					stateForces += entry.state.force();
				};
			};
		};
		return Math.max(stateForces + partisanForces * 0.1,partisanForces * 0.25);
	};
};

function Population(tile) {
	map.populations.push(this);
	this.name = undefined;
	this.tile = tile;
	this.population = Math.max(Math.round(100 * tile.precipitation),20);
	this.languages = [];
	this.conventions = [];
	this.faiths = [];
	this.states = [];
	this.crops = [];
	this.livestock = [];
	this.foodCulture = 'hunter-gatherer';
	this.socialStructure = 'society';
	
	this.developConvention = function() {
		var existingConventions = [];
		for (var convention of this.conventions) {
			existingConventions.push(convention.convention);
		};
		this.conventions.push({convention:new Convention(existingConventions),strength:Math.random()*0.9+0.1});
	};
	for (var i = 0; i < 1; i++) {
		this.developConvention();
	};
	
	this.status = function() {
		var status = {};
		for (var entry of this.conventions) {
			var targetString = entry.convention.target.replace(/ /g,"_");
			if (status[targetString] == undefined) {status[targetString]=0};
			if (entry.convention.respect) {
				status[targetString] += entry.strength;
			} else {
				status[targetString] -= entry.strength;
			};
		};
		return status;
	};
	this.ranking = function() {
		var rankingArray = [];
		var status = this.status();
		
		for (var entry in status) {
			rankingArray.push(entry);
		};
		rankingArray.sort(function(a,b) {return status[a] < status[b]});

		return rankingArray;
	};
	this.setSocialStructure = function() {
		var socialStructures = [];
		var ranking = this.status();
		var rankingArray = this.ranking();
		if (ranking.men == undefined) {ranking.men = 0};
		if (ranking.women == undefined) {ranking.women = 0};
		if (ranking.genderqueers == undefined) {ranking.genderqueers = 0};
		
		if (ranking.men == ranking.women && ranking.women == ranking.genderqueers) {
// 			socialStructures.push('gender-egalitarian');
		} else if (ranking.men >= 0 && ranking.men >= ranking.women && ranking.men >= ranking.genderqueers) {
			socialStructures.push('patriarchal');
		} else if (ranking.women >= 0 && ranking.women >= ranking.men && ranking.women >= ranking.genderqueers) {
			socialStructures.push('matriarchal');
		} else if (ranking.genderqueers >= 0 && ranking.genderqueers >= ranking.women && ranking.genderqueers >= ranking.men) {
			socialStructures.push('queer');
		};
		if (rankingArray[0] == 'the_natural_world') {
			socialStructures.push('green');
		};
		if ( (ranking.rich >= 0 && ranking.rich == ranking[rankingArray[0]]) || (ranking.the_powerful > 0 && ranking.the_powerful == ranking[rankingArray[0]]) || (ranking.the_strong > 0 && ranking.the_strong == ranking[rankingArray[0]]) ) {
			socialStructures.push('oligarchal');
		};
		if ( (ranking.your_elders >= 0 && ranking.your_elders == ranking[rankingArray[0]]) || (ranking.ancestors > 0 && ranking.ancestors == ranking[rankingArray[0]]) ) {
			socialStructures.push('traditionalist');
		};
		if (ranking.the_weak > 0 || ranking.prisoners > 0) {
			socialStructures.push('chivalrous');
		};
		if (ranking.the_hungry > 0 || ranking.outsiders > 0) {
			socialStructures.push('hospitable');
		};
		if (ranking.debtors > 0) {
			socialStructures.push('forgiving');
		};
		if (ranking.the_young > 0) {
			socialStructures.push('nurturing');
		};
		if (ranking.ascetics > 0 && (ranking.sybarites == undefined || ranking.ascetics > ranking.sybarites)) {
			socialStructures.push('ascetic');
		};
		if (ranking.sybarites > 0 && (ranking.ascetics == undefined || ranking.sybarites > ranking.ascetics)) {
			socialStructures.push('sybaritic');
		};
		
		var socialStructure = '';
		for (var structure of socialStructures) {
			socialStructure += structure + ', ';
		};
		this.socialStructure = socialStructure;
	};
	this.setSocialStructure();
	
	this.range = function() {
		var withinRange = [];
		for (var tile of this.tile.adjacent) {
			if (tile.populations !== undefined) {
				withinRange.push(tile);
			};
		};
		var adjacentRivers = [];
		for (var v of this.tile.vertices) {
			for (var edge of v.edges) {
				if (edge.drainage > 20) {
					adjacentRivers.push(edge.topVertex);
					adjacentRivers.push(edge.bottomVertex);
				};
			};
		};
		var nearbyRivers = [];
		for (var v of adjacentRivers) {
			for (var edge of v.edges) {
				if (edge.drainage > 20) {
					nearbyRivers.push(edge.topVertex);
					nearbyRivers.push(edge.bottomVertex);
				};
			};
		};
		for (var v of nearbyRivers) {
			for (var edge of v.edges) {
				for (var tile of edge.tiles) {
					if (withinRange.indexOf(tile) == -1 && tile.populations !== undefined) {
						withinRange.push(tile);
					};
				};
			};
		};
		
		// lake contacts?
		
		// over sea contacts
		
		return withinRange;
	};
		
	this.generation = function() {
		var resultArray = [];
		
		// entropy
		var languageTotal = 0;
		var highest = 0;
		var highestLanguage = undefined;
		for (var language of this.languages) {
			language.percentage *= Math.random() * 0.5 + 0.5;
			languageTotal += language.percentage;
			if (language.percentage > highest) {
				highest = language.percentage;
				highestLanguage = language;
			};
		};
		if (languageTotal < 1 && highestLanguage !== undefined) {
			highestLanguage.percentage += (1-languageTotal);
		};
		for (var convention of this.conventions) {
			convention.strength *= Math.random() * 0.5 + 0.5;
		};
		
		// eat / set foodCulture / pop gain
		var granaries = false;
// 		var indYield = 0;
		var stableCropYields = [], perishCropYields = [], huntingAssists = [], laborAssists = [], pestControlAssists = [], livestockYields = [];
		for (var crop of this.crops) {
			if (crop.temperatureRange[0] < this.tile.temperature && crop.temperatureRange[1] > this.tile.temperature) {
				var irrigation = this.tile.precipitation;
				// human irrigation goes here
				var irrigationFactor = irrigation / crop.idealPrecipitation;
				if (irrigationFactor > 1) {
					irrigationFactor = Math.max(0,2 - irrigationFactor);
				};
				yield = crop.yields.food * irrigationFactor;
			};
			if (crop.stable) {
				granaries = true;
				stableCropYields.push(yield);
			} else {
				perishCropYields.push(yield);
			};
		};
		for (var livestock of this.livestock) {
			if (livestock.temperatureRange[0] < this.tile.temperature && livestock.temperatureRange[1] > this.tile.temperature) {
				huntingAssists.push(livestock.traits.hunting);
				laborAssists.push(livestock.traits.labor);
				pestControlAssists.push(livestock.traits.pestcontrol);
				livestockYields.push(livestock.traits.meat+livestock.traits.milk);
			};
		};
		var tileCapacity = 100;
		var pestControlValue = 1+pseudosum(pestControlAssists);
		for (var i in stableCropYields) {
			stableCropYields[i] *= pestControlValue;
		};
		var allCropYields = stableCropYields.concat(perishCropYields);
		var hunterGathererYield = tileCapacity * (1+this.tile.precipitation) * (1+pseudosum(huntingAssists));
		var pastoralYield = tileCapacity * (1+pseudosum(livestockYields));
		var agrarianYield = tileCapacity * (1+pseudosum(allCropYields)) * (1+pseudosum(laborAssists))* (1+pseudosum(livestockYields)/4);
		
		var newFoodCulture, biggestYield;
		if (this.livestock.length > 0 && pastoralYield >= hunterGathererYield && pastoralYield >= agrarianYield) {
			newFoodCulture = 'pastoral';
			biggestYield = pastoralYield;
			map.history.pastoralCount++;
		} else if (pseudosum(allCropYields) > 0 && agrarianYield >= hunterGathererYield && agrarianYield >= pastoralYield) {
			newFoodCulture = 'agrarian';
			biggestYield = agrarianYield;
			map.history.agrarianCount++;
		} else {
			newFoodCulture = 'hunter-gatherer';
			biggestYield = hunterGathererYield;
			map.history.hgCount++;
		};
		this.yieldsNote = [Math.round(hunterGathererYield),Math.round(pastoralYield),Math.round(agrarianYield)];
		if (newFoodCulture !== this.foodCulture) {
			resultArray.push(new Event([this.tile],this,'foodCulture',[newFoodCulture,this]));
			this.foodCulture = newFoodCulture;

// 			hunterGathererYield = Math.round(hunterGathererYield);
// 			pastoralYield = Math.round(pastoralYield);
// 			agrarianYield = Math.round(agrarianYield);
// 			console.log(this.foodCulture,hunterGathererYield,pastoralYield,agrarianYield,allCropYields,this);
		};
		
		// Taxes to the Treasuries
		if (this.states.length > 0) {
			var totalTax = 0;
			for (var entry of this.states) {
				totalTax += entry.state.tax;
				entry.state.treasury += (Math.min(biggestYield,this.population*1.25) * entry.state.tax)/this.states.length;
			};
			biggestYield *= 1 - totalTax;
			if (totalTax > 0.5) {
// 				console.log('huge taxation: ',totalTax,this);
			};
		};
		
		this.population = Math.round(Math.min(biggestYield,this.population * 1.1));
		
		// State Formation
		if ((this.foodCulture == 'agrarian' || this.foodCulture == 'industrial') && granaries && this.states.length == 0) {
			var coercedLabor = false;
			for (var convention of this.conventions) {
				if (convention.convention.assignation == 'expect servitude from' || convention.convention.assignation == 'offer tribute to') {
					coercedLabor = true;
				};
			};
			if (coercedLabor) {
				var newState = new State(this);
				resultArray.push(new Event([this.tile],this,'state',[newState]));
			};
		};
		
		// Developments: domesticate crop/livestock, breed crop/livestock, tech
		if (Math.random() < 0.0001) {
			if (false) {
			} else if (Math.random() > 0.5) {
				var ancestor = undefined, type = 'domestication';
				if (this.crops.length > 3) {
					ancestor = this.crops[Math.random() * this.crops.length << 0];
					type = 'breeding';
				};
				var crop = new Crop(this.tile,this,ancestor);
				this.crops.push(crop);
				resultArray.push(new Event([this.tile],this,type,[crop]));
			} else {
				var ancestor = undefined, type = 'domestication';
				if (this.livestock.length > 2) {
					ancestor = this.livestock[Math.random() * this.livestock.length << 0];
					type = 'breeding';
				};
				var livestock = new Livestock(this.tile,this,ancestor);
				this.livestock.push(livestock);
				resultArray.push(new Event([this.tile],this,type,[livestock]));
			};
		};
		
		// pick a contact and share one or more of: language, conventions, faiths, crops, livestock
		var withinRange = this.range();
		for (var tile of withinRange) {
			var contactPop = tile.populations[Math.random() * tile.populations.length << 0];
			if (contactPop !== undefined) {
				var contactLanguage = contactPop.languages[Math.random() * contactPop.languages.length << 0];
				var contactConvention = contactPop.conventions[Math.random() * contactPop.conventions.length << 0];
				if (contactConvention !== undefined) {contactConvention = contactConvention.convention};
				var contactCrop = contactPop.crops[Math.random() * contactPop.crops.length << 0];
				var contactLivestock = contactPop.livestock[Math.random() * contactPop.livestock.length << 0];
			
				// Language Diffusion
				var languageImprovement = false;
				for (var language of this.languages) {
					view.errorModel874 = language;
					if (language.language == contactLanguage.language) {
						language.percentage = Math.min(1,language.percentage + Math.random() * 0.05);
						languageImprovement = true;
					};
				};
				if (languageImprovement == false  && contactLanguage.percentage > 0.3 ) {
					this.languages.push({language:contactLanguage.language,percentage:0.01*Math.random()});
				};
			
				// Convention Diffusion
				if (contactConvention == undefined) {
					console.log('no convention on contact',contactPop);
				} else {
					var conventionShareChance = 0.5;
					var alreadyShared = false;
					for (var convention of this.conventions) {
						if (convention.convention.target == contactConvention.target && convention.convention.assignation == contactConvention.assignation) {
							convention.strength = Math.min(1,convention.strength + Math.random()*0.2);
							conventionShareChance = 0;
							alreadyShared = true;
						} else if (convention.convention.target == contactConvention.target && convention.convention.respect == contactConvention.respect) {
							convention.strength = Math.min(1,convention.strength + Math.random()*0.1);
							conventionShareChance += convention.strength;
						} else if (convention.convention.target == contactConvention.target && convention.convention.respect !== contactConvention.respect) {
							convention.strength = Math.min(1,convention.strength - Math.random()*0.05);
							conventionShareChance -= convention.strength;
						};
						if (convention.strength < 0.1) {this.conventions.splice(this.conventions.indexOf(convention),1);};
					};
					if (!alreadyShared && Math.random() < conventionShareChance/5) {
						this.conventions.push({convention:contactConvention,strength:0.5 * Math.random()});
					};
					if (this.conventions.length == 0) {this.conventions = [{convention:new Convention(),strength:0.1}];};
				};
			
				// Faith Diffusion Goes Here
			
				// Crops
				if (contactCrop !== undefined && Math.random() < 0.3 && this.crops.indexOf(contactCrop) == -1 && contactCrop.temperatureRange[0] < this.tile.temperature && contactCrop.temperatureRange[1] > this.tile.temperature) {
					this.crops.push(contactCrop);
				};
			
				// Livestock
				if (contactLivestock !== undefined && Math.random() < 0.3 && this.livestock.indexOf(contactLivestock) == -1 && contactLivestock.temperatureRange[0] < this.tile.temperature && contactLivestock.temperatureRange[1] > this.tile.temperature) {
					this.livestock.push(contactLivestock);
				};
			};
		};
		
		if (this.population < 1) {
			map.history.lostPopulations.push(this);
		};
		
		return resultArray;
	};
};

function Convention(existingConventions) {
	this.string = '';
	this.assignation = undefined;
	this.target = undefined;
	this.respect = respect = Math.random() >= 0.5;
	var assignments, targets;
	var defaultRespectTargets = ['ancestors','your elders','the powerful','the rich','the strong'];
	var defaultDisrespectTargets = ['debtors','the hungry','outsiders','prisoners','the weak','the young'];
	var defaultAmbiguousTargets = ['the natural world','women','men','genderqueers','heterosexuals','homosexuals','pansexuals','asexuals','ascetics','sybarites'];
	if (this.respect) {
		assignments = ['assume people are by default','defer to','give precedence to','sacrifice for','offer tribute to'];
	} else {
		assignments = ['disdain','erase','demand precedence before','expect servitude from','silence','target violence on'];
	};
	this.assignation = assignments[Math.random() * assignments.length << 0];
	if (existingConventions !== undefined) {
		var respectTargets = [], disrespectTargets = [];
		for (var convention of existingConventions) {
			if (convention.respect) {
				respectTargets.push(convention.target);
			} else {
				disrespectTargets.push(convention.target);
			};
		};
		respectTargets = respectTargets.concat(respectTargets);
		disrespectTargets = disrespectTargets.concat(disrespectTargets);
		for (var target of defaultRespectTargets) {
			if (respectTargets.indexOf(target) == -1 && disrespectTargets.indexOf(target) == -1) {
				respectTargets.push(target);
			};
		};
		for (var target of defaultDisrespectTargets) {
			if (respectTargets.indexOf(target) == -1 && disrespectTargets.indexOf(target) == -1) {
				disrespectTargets.push(target);
			};
		};
		for (var target of defaultAmbiguousTargets) {
			if (respectTargets.indexOf(target) == -1 && disrespectTargets.indexOf(target) == -1) {
				respectTargets.push(target);
				disrespectTargets.push(target);
			};
		};
		if (this.respect) {
			targets = respectTargets;
		} else {
			targets = disrespectTargets;
		};
		targets = targets.concat(targets.concat(targets));
		targets = targets.concat(respectTargets.concat(disrespectTargets));
	} else {
		if (Math.random() >= 0.5) {
			targets = defaultRespectTargets;
		} else {
			targets = defaultDisrespectTargets;
		};
		targets = targets.concat(targets.concat(targets));
		targets = targets.concat(defaultAmbiguousTargets);
	};
	this.target = targets[Math.random() * targets.length << 0];
	this.string += this.assignation + ' ' + this.target;
};

function Language() {
	this.name = undefined;
	this.lexicon = {};
	this.color = 'rgb('+(20 + Math.random() * 80)+'%, '+(20 + Math.random() * 80)+'%, '+(20 + Math.random() * 80)+'%)';

	
	// Sounds Used in the Language
	this.consonants = ['b','c','d','f','g','h','j','k','l','m','n','p','q','r','s','t','v','w','x','y','z'];
	var removeNum = this.consonants.length/2;
	for (var i=0;i<removeNum;i++) {
		this.consonants.splice(Math.random() * this.consonants.length << 0,1);
	};
	for (var i=0;i<removeNum;i++) {
		this.consonants.push(this.consonants[Math.random() * this.consonants.length << 0]);
	};
	this.vowels = ['a','e','i','o','u','ae','ai','au','ea','ee','ei','eu','ia','ie','io','iu','oa','oe','oi','oo','ou','ua','ue','ui','uo'];
	var removeNum = this.vowels.length/2;
	for (var i=0;i<removeNum;i++) {
		this.vowels.splice(Math.random() * this.vowels.length << 0,1);
	};
	for (var i=0;i<removeNum;i++) {
		this.vowels.push(this.vowels[Math.random() * this.vowels.length << 0]);
	};

	this.word = function(meaning,syllables,capitalize) {
		if (meaning !== undefined && this.lexicon[meaning] !== undefined) {
			string = this.lexicon[meaning];
		} else {
			if (syllables == undefined) {
				syllables = 2 + Math.random() * Math.random() * Math.random() * 3 << 0;
				if (syllables == 4) { syllables = 1 }
			};
			var string = '';
			for (var s=0;s<syllables;s++) {
				if (Math.random() > 0.2) {
					string += this.consonants[Math.random() * this.consonants.length << 0];
				};
				string += this.vowels[Math.random() * this.vowels.length << 0];
				if (Math.random() > 0.5) {
					string += this.consonants[Math.random() * this.consonants.length << 0];
				};
			};
			if (capitalize) {
				string = string.charAt(0).toUpperCase() + string.slice(1);
			};
			this.lexicon[meaning] = string;
		};
		return string;
	};
	this.name = this.word('thisLanguage',undefined,true);
};

function Faith() {
};

function State(population) {
	this.name = undefined;
	this.color = 'rgb(100%, '+(20 + Math.random() * 80)+'%, '+(20 + Math.random() * 80)+'%)';
	this.treasury = 0;
	this.tax = 0.05 + Math.random() * 0.2;
	this.forces = 1;
	this.forceMultipliers = [];
	this.territory = [population.tile];
	
	this.founders = population;
	var stateType = 'state';
	this.languages = [];
	for (var entry in population.languages) {
		if (entry.percentage > 0.5) {
			this.languages.push(entry.language);
		};
	};
	if (this.languages.length == 0) {this.languages = [population.languages[0].language]};
	var namingLanguage = this.languages[Math.random() * this.languages.length << 0];
	if (namingLanguage.lexicon.endolinguaphone == undefined) {
		var endolinguaphone = namingLanguage.word('thisLanguage') + namingLanguage.word('suffixOf',1);
		namingLanguage.lexicon.endolinguaphone = endolinguaphone;
		this.name = endolinguaphone + ' ' + namingLanguage.word(stateType,2,true);
	} else {
		var adjectiveList = ['black','white','tall','strong','little','greater','lesser','true','pseudo','far','near'];
		var adjective = adjectiveList[Math.random() * adjectiveList.length << 0];
		this.name = namingLanguage.word(adjective,1 + Math.random() * 2 << 0,true) + ' ' + namingLanguage.word('endolinguaphone') + ' ' + namingLanguage.word(stateType,2,true);
	};
	
	map.states.push(this);
	population.states.push({state:this,loyalty:0.5});
// 	population.tile.states.push(this);
// 	view.colorStateTile(population.tile.id,this);
	view.colorStateTile(population.tile);
	
	this.force = function() {
		return this.forces;
	};
	
	this.frontier = function(landOrSea) {
		var frontier = [];
		for (var tile of this.territory) {
			for (var neighbor of tile.neighbors) {
				if (this.territory.indexOf(neighbor) == -1 && neighbor.z > 0 && !neighbor.ice && neighbor.biome !== 'lake') {
					frontier.push(neighbor);
				};
			};
		};
		return frontier;
	};
	
	this.generation = function() {
		var resultArray = [];
		
		// Managing Forces
		this.treasury -= this.forces;
		if (this.treasury > 0) {
			this.forces += Math.floor(this.treasury * 0.1);
		} else {
			this.forces = Math.floor(this.forces * 0.75);
		};
		
		// Increasing Loyalty
		for (var tile of this.territory) {
			for (var pop of tile.populations) {
				for (var entry of pop.states) {
					if (entry.state == this) {
						entry.loyalty += Math.random() * 0.1;
					};
				};
			};
		};
		
		// Internal Colonization (including repopulating genocided tiles)
		// Especially tiles with no agrarian society; send in farmers and seeds!
		for (var tile of this.territory) {
			if (this.forces > 20 && tile.populations.length == 0) {
				this.forces -= 20;
				var colonists = new Population(tile);
				tile.populations.push(colonists);
				colonists.states.push({state:this,loyalty:0.9});
// 				view.colorStateTile(tile.id,this);
				view.colorStateTile(tile);
				colonists.languages = [{language:this.founders.languages[Math.random() * this.founders.languages.length << 0].language,percentage:1}];
				colonists.conventions = [];
				for (var entry of this.founders.conventions) {
					if (Math.random() > 0.5) {
						colonists.conventions.push({convention:entry.convention,strength:Math.random()});
					};
				};
				for (var crop of this.founders.crops) {
					colonists.crops.push(crop);
				};
				for (var livestock of this.founders.livestock) {
					colonists.livestock.push(livestock);
				};
			};
		};
		
		// Squashing Dissent
		var dissentingPops = [];
		for (var tile of this.territory) {
			for (var pop of tile.populations) {
				if (pop.states.length > 1) {
					dissentingPops.push(pop);
				};
			};
		};
		for (var pop of dissentingPops) {
			pop.population -= this.force() * 0.1;
			this.forces *= 0.95;
			if (pop.population <= 0) {
				resultArray.push(new Event([tile],this,'genocide'));
				pop.tile.populations.splice(pop.tile.populations.indexOf(pop),1);
// 				pop.tile.states = [];
// 				for (var survivingPop of pop.tile.populations) {
// 					for (var entry of survivingPop.states) {
// 						pop.tile.states.push(entry.state);
// 					};
// 				};
// 				view.colorStateTile(pop.tile.id,pop.tile.states[0]);
				view.colorStateTile(pop.tile);
			} else {
				for (var entry of pop.states) {
					if (entry.state !== this) {
						entry.loyalty -= 0.1 * Math.random();
						if (entry.loyalty <= 0) {
							entry.state.territory.splice(entry.state.territory.indexOf(pop.tile),1);
// 							pop.tile.states.splice(pop.tile.states.indexOf(entry.state),1);
							pop.states.splice(pop.states.indexOf(entry),1);
// 							view.colorStateTile(pop.tile.id,this);
							view.colorStateTile(pop.tile);
						};
					};
				};
			};
		};
		
		// Expansion
		var frontier = this.frontier('land');
		frontier.sort(function(a,b) {return a.defense() > b.defense()});
		for (var tile of frontier) {
			if (this.force() > tile.defense()) {
				for (var pop of tile.populations) {
					pop.states.push({state:this,loyalty:0.1});
// 					tile.states.push(this);
					this.territory.push(tile);
// 					view.colorStateTile(tile.id,this);
					view.colorStateTile(tile);
					resultArray.push(new Event([tile],this,'conquest'));
				};
				this.forces = Math.max(0,this.forces - tile.defense() * 0.1);
			} else {
				break;
			};
		};
		
		// Collapse
		var collapse = this.treasury + this.force() < -10;
		if (collapse) {
			map.states.splice(map.states.indexOf(this),1);
			var territory = [];
			for (var tile of this.territory) {
				territory.push(tile);
			};
			resultArray.push(new Event(territory,this,'collapse'));
			for (var tile of this.territory) {
				for (var pop of tile.populations) {
					for (var entry of pop.states) {
						if (entry.state == this) {
							pop.states.splice(pop.states.indexOf(entry),1);
						};
					};
				};
				view.colorStateTile(tile);
// 				this.territory.splice(this.territory.indexOf(tile),1);
			};
		};
		
		return resultArray;
	};
};

function Crop(nativeTile,population,ancestor) {
	map.species.push(this);
	this.name = undefined;
	if (ancestor == undefined) {
		this.type = ['root','fruit','seed','leaf','berry'][Math.random() * 5 << 0];
		var tempRange = 10 * Math.random();
		var tileInRange = Math.random();
		this.temperatureRange = [nativeTile.temperature - tempRange*tileInRange,nativeTile.temperature + tempRange*(1-tileInRange)];
		this.idealPrecipitation = Math.max(1,nativeTile.precipitation + Math.random()*4 - 2);
		this.stable = Math.random() >= 0.5;
		this.yields = {
			food: Math.random() * Math.random() * Math.random(),
			fiber: Math.random() * Math.random() * Math.random(),
			lumber: Math.random() * Math.random() * Math.random(),
		};
		if (this.yields.food > this.yields.lumber || this.yields.fiber > this.yields.lumber) {
			this.yields.lumber = 0;
		} else {
			this.type = 'tree';
		};
	} else {
		this.type = ancestor.type;
		this.temperatureRange = [ancestor.temperatureRange[0],ancestor.temperatureRange[0]];
		this.idealPrecipitation = ancestor.idealPrecipitation;
		this.stable = ancestor.stable;
		this.yields = {
			food: ancestor.yields.food,
			fiber: ancestor.yields.fiber,
			lumber: ancestor.yields.lumber,
		};
	};
	var highest = 0;
	var highestTrait = undefined;
	for (var yield in this.yields) {
		if (this.yields[yield] > highest) {
			highest = this.yields[yield];
			highestTrait = yield;
		};
	};
	this.use = highestTrait;
	var descriptors = ['red','green','yellow','big','little','sweet','fuzzy','earth'];
	var descriptor = descriptors[Math.random() * descriptors.length << 0];
	if (population == undefined || population.languages.length == 0) {
		this.name = new Language().word('crop',1);
	} else {
		var language = population.languages[population.languages.length * Math.random() << 0].language;
		var descriptor = language.word(descriptor,1 + Math.random() * 2 << 0);
		var type = language.word(type,1);
		this.name = descriptor + type + ' ' + this.type;
	};
	
	this.yield = function(tile) {
		yield = 0;
		if (tile.temperature >= this.temperatureRange[0] && tile.temperature <= this.temperatureRange[1]) {
			yield = this.yields.food * (10 - Math.abs(tile.temperature-this.idealTemperature)) / 10;
		};
		return yield;
	};
};

function Livestock(nativeTile,population,ancestor) {
	map.species.push(this);
	this.name = undefined;
	this.ancestor = ancestor;
	var tempRange = 20 * Math.random();
	var tileInRange = Math.random();
	this.temperatureRange = [nativeTile.temperature - tempRange*tileInRange,nativeTile.temperature + tempRange*(1-tileInRange)];
	var prototraits = [];
	this.prototraits = {};
	if (ancestor == undefined) {
		for (var prototrait of ['carnivore','litter','mammal','size','social']) {
			prototraits[prototrait] = Math.random();
			this.prototraits[prototrait] = prototraits[prototrait];
		};
	} else {
		for (var prototrait in ancestor.prototraits) {
			var newValue = ancestor.prototraits[prototrait] * (Math.random() * 0.4 + 0.8);
			prototraits[prototrait] = newValue;
			this.prototraits[prototrait] = newValue;
		};
	};
	this.traits = {
		fiber: 0.5 * Math.random() * Math.random() * Math.round(Math.random()) * Math.round(Math.random()),
		hunting: 0.5 * prototraits.carnivore * prototraits.social,
		labor: 0.5 * prototraits.size * prototraits.social,
		meat: 0.5 * prototraits.size * prototraits.litter,
		milk: 0.25 * prototraits.size * Math.round(prototraits.mammal),
		pestcontrol: 0.5 * prototraits.carnivore * (1-prototraits.size),
		transport: 0.5 * prototraits.size * (1-prototraits.carnivore),
	};
	if (ancestor !== undefined) {
		this.traits.fiber = ancestor.traits.fiber * (Math.random() * 0.4 + 0.8);
	};
	for (var trait in this.traits) {
		this.traits[trait] = Math.max(this.traits[trait],0);
	};
	var highest = 0;
	var highestTrait = undefined;
	for (var trait in this.traits) {
		if (this.traits[trait] > highest) {
			highest = this.traits[trait];
			highestTrait = trait;
		};
	};
	this.use = highestTrait;
	this.type = 'beast';
	if (ancestor !== undefined) {
		this.type = ancestor.type;
	} else if (this.use == 'fiber') {
		if (prototraits.mammal < 0.5) {
			this.type = 'silkworm';
		} else {
			this.type = ['sheep','llama','alpaca','yak'][Math.random() * 4 << 0];
		};
	} else if (this.use == 'hunting') {
		if (prototraits.mammal < 0.5) {
			this.type = ['falcon','eagle'][Math.random() * 2 << 0];
		} else {
			this.type = 'hound';
		};
	} else if (this.use == 'labor' || this.use == 'transport') {
		if (prototraits.mammal > 0.5) {
			if (prototraits.size > 0.9) {
				this.type = 'elephant';
			} else {
				this.type = ['bull','horse','donkey','reindeer'][Math.random() * 4 << 0];
			};
		} else {
			this.type = ['lizard','chocobo'][Math.random() * 2 << 0];
		};
	} else if (this.use == 'meat' || this.use == 'milk') {
		if (prototraits.mammal > 0.5) {
			if (prototraits.size < 0.3) {
				this.type = ['cavia','rabbit'][Math.random() * 2 << 0];
			} else if (prototraits.size < 0.7) {
				this.type =  ['goat','pig','sheep'][Math.random() * 3 << 0];
			} else {
				this.type =  ['bull','buffalo','bison','llama','yak'][Math.random() * 5 << 0];
			};
		} else {
			this.type = ['fowl','bird','duck','turkey'][Math.random() * 4 << 0];
		};
	} else if (this.use == 'pestcontrol') {
		if (prototraits.mammal > 0.5) {
			this.type = 'cat';
		} else {
			this.type = 'gecko';
		};
	};
	if (population == undefined || population.languages.length == 0) {
		this.name = new Language().word(this.type);
		this.name += ' ' + this.type;
	} else {
		var language = population.languages[population.languages.length * Math.random() << 0].language;
		this.name = language.word(this.type,1 + Math.random() * 2 << 0) + ' ' + this.type;
	};
};

function History() {
	this.running = false;
	this.record = [];

	this.generation = function() {
		var eventList = [], resultArray;
		this.lostPopulations = [];
		this.hgCount = 0;
		this.pastoralCount = 0;
		this.agrarianCount = 0;
		this.industrialCount = 0;
		
		for (var population of map.populations) {
			resultArray = population.generation();
			if (resultArray.length > 0) {eventList = eventList.concat(resultArray)};
		};
		for (var state of map.states) {
			resultArray = state.generation();
			if (resultArray.length > 0) {eventList = eventList.concat(resultArray)};
		};
		for (var population of this.lostPopulations) {
			map.populations.splice(map.populations.indexOf(population),1);
			population.tile.populations.splice(population.tile.populations.indexOf(population),1);
		};
		console.log('food cultures:',this.hgCount,this.pastoralCount,this.agrarianCount);
	
		view.displayEvents(eventList);
		if (view.focus.tile !== undefined) {view.displayDetails(view.focus.tile);};
		this.record.push(eventList);
		var timedEvent = setTimeout(map.history.queuedGeneration.bind(map.history),1000);
	};
	
	this.queuedGeneration = function() {
		if (this.running) {
			this.generation();
		};
	};
};

function Event(tiles,actor,type,argsArray) {
	if (tiles == undefined) {tiles = []};
	if (argsArray == undefined) {argsArray = []};
	this.tiles = tiles;
	this.actor = actor;
	this.type = type;
	this.argsArray = argsArray;
	this.displayString = function() {
		var string = '';
		if (tiles.length == 1) {
			string = 'At '+tiles[0].coordinates+', ';
		} else if (tiles.length > 1) {
			string = 'Across '+tiles.length+' tiles, ';
		};
		if (this.type == undefined) {
			string += 'A generation passes.';
		} else if (this.type == 'domestication') {
			string += 'Domestication of the ' + argsArray[0].name;
		} else if (this.type == 'breeding') {
			string += 'Selective breeding produces the ' + argsArray[0].name;
		} else if (this.type == 'state') {
			string += 'the ' + argsArray[0].name + ', a rudimentary state, is founded.';
		} else if (this.type == 'conquest') {
			string += actor.name + ' expands its borders.';
		} else if (this.type == 'genocide') {
			string += actor.name + ' commits genocide!';
		} else if (this.type == 'collapse') {
			string += actor.name + ' collapses!';
		} else if (this.type = 'foodCulture') {
			if (argsArray[0] == 'pastoral') {
				var livestockList = [];
				for (var livestock of argsArray[1].livestock) {
					livestockList.push(livestock.name);
				};
				string += 'A pastoral culture develops around the ' + prettyList(livestockList) + '.';
			} else if (argsArray[0] == 'agrarian') {
				var cropsList = [];
				for (var crop of argsArray[1].crops) {
					cropsList.push(crop.name);
				};
				string += 'An agrarian culture develops around the ' + prettyList(cropsList) + '.';
			} else if (argsArray[0] == 'hunter-gatherer') {
				string += 'People return to hunter-gatherer culture.';
			} else {
				console.log('error:',tiles,actor,type,argsArray);
				string += 'A ' + argsArray[0] + ' food culture develops.';
			};
		};
		return string;
	};
};

function prettyList(list,andor) {
	if (andor == undefined) {andor = 'and'};
	var prettyList = '';
	for (item in list) {
		prettyList += ' ' + list[item];
		if (item == list.length-1) {
		} else if (list.length == 2) {
			prettyList += ' ' + andor;
		} else if (item == list.length-2) {
			prettyList += ', ' + andor;
		} else {
			prettyList += ',';
		};
	};
	return prettyList;
};

function pseudosum(array) {
	array.sort(function(a,b){return b-a;});
	var pseudosum = 0;
	for (var num in array) {
		pseudosum += array[num] / Math.pow(1.5,num);
	};
	return pseudosum;
};
