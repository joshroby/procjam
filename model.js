function Map(sizeX,sizeY,step,topLatitude,bottomLatitude) {
	if (sizeX == undefined) {sizeX = 1000};
	if (sizeY == undefined) {sizeY = sizeX * 0.7};
	if (step == undefined) {step = 10};
	if (topLatitude == undefined) {topLatitude = 90};
	if (bottomLatitude == undefined) {bottomLatitude = -90};
	this.sizeX = sizeX;
	this.sizeY = sizeY;
	this.step = step;
	this.verticesArray = [];
	this.vertices = [];
	this.edges = [];
	this.edgeLibrary = {};
	this.tiles = [];
	this.basins = [];
	var i, x, y;

	// Random Seed Vertices
	for (var x=step;x<sizeX;x+=step) {
		for (var y=step;y<sizeX;y+=step) {
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

	console.time("triangulate");
	this.triangles = Delaunay.triangulate(this.verticesArray);
	console.timeEnd("triangulate");
	
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
				z: Math.random() * 0.5 - 0.25,
				edgeLibrary: {},
				index: i,
			};
		};
	};

	console.time('compiling tiles and edges');
	for (i = this.triangles.length; i; ) {
		var newTile = {vertices:[],precipitation:0,temperature:0};
		var vertexIndices = [];
		--i;newTile.vertices.push(this.vertices[this.triangles[i]]);vertexIndices.push(this.triangles[i]);
		--i;newTile.vertices.push(this.vertices[this.triangles[i]]);vertexIndices.push(this.triangles[i]);
		--i;newTile.vertices.push(this.vertices[this.triangles[i]]);vertexIndices.push(this.triangles[i]);
		this.tiles.push(newTile);
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
	console.timeEnd('compiling tiles and edges');

	console.time("neighbors");
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
	console.timeEnd("neighbors");
	
	this.impacts = function() {
		var plates = [];
		for (var i=0;i<2*(this.sizeX,this.sizeY)/this.step;i++) {
			var plate = {
				cx: Math.random() * this.sizeX,
				cy: Math.random() * this.sizeY,
				r: (Math.random()/2 + 0.5) * Math.min(this.sizeX,this.sizeY) * 0.25,
				dz: 4 * Math.random() - 2,
			};
			plate.c2x = plate.cx + Math.random() * plate.r - plate.r/2;
			plate.c2y = plate.cy + Math.random() * plate.r - plate.r/2;
			plate.r2 = plate.r * Math.random() * 0.9;
			plates.push(plate);
			if (plate.cx < this.sizeX * 0.05 || plate.cx > this.sizeX * 0.95 || plate.cy < 0 || plate.cy > this.sizeY) {
				plate.dz = -1 * Math.abs(plate.dz);
			};
		};
		var mirrorPlates = [];
		for (var plate of plates) {
			var p1 = {
				cx: plate.cx + this.sizeX,
				cy: plate.cy,
				r: plate.r,
				dz: plate.dz,
				c2x: plate.c2x,
				c2y: plate.c2y,
				r2: plate.r2,
			};
			var p2 = {
				cx: plate.cx - this.sizeX,
				cy: plate.cy,
				r: plate.r,
				dz: plate.dz,
				c2x: plate.c2x,
				c2y: plate.c2y,
				r2: plate.r2,
			};
			mirrorPlates.push(p1);
			mirrorPlates.push(p2);
		};
		plates = plates.concat(mirrorPlates);
		for (var plate of plates) {
			for (v of this.vertices) {
				if (Math.pow(Math.pow(v.x - plate.cx,2)+Math.pow(v.y - plate.cy,2),0.5) < plate.r) {
					if ((Math.pow(Math.pow(v.x - plate.c2x,2)+Math.pow(v.y - plate.c2y,2),0.5) > plate.r2)) {
						v.z += plate.dz;
					};
				};
			};
		};
	};
	
	this.tectonics = function() {
		var plates = [];
		for (var i=0;i<50;i++) {
			var plate = {
				x: Math.random() * this.sizeX,
				y: Math.random() * this.sizeY,
				z: Math.random() * 4 - 2,
				size: Math.random() * Math.random() * Math.random() * 7 + 1,
				dx: Math.random() - 0.5,
				dy: Math.random() - 0.5,
				vertices: [],
				color: 'rgb('+(Math.random() * 100)+'%, '+(Math.random() * 100)+'%, '+(Math.random() * 100)+'%)',
			};
			if (plate.x < this.sizeX * 0.05 || plate.x > this.sizeX * 0.95 || plate.y < 0 || plate.y > this.sizeY) {
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
					var zChange = 0.5 * (centerDistance - motionDistance);
// 					vertex.z += zChange;
					for (var potential of vertex.plate.vertices) {
						distance = Math.pow(Math.pow(potential.x - vertex.x,2)+Math.pow(potential.y - vertex.y,2),0.5);
						if (distance < crumpleDistance) {
							potential.z += zChange * (crumpleDistance - distance) / crumpleDistance;

						};
					};
				};
// 				if (e.vertices[0].plate.dx == e.vertices[1].plate.dx) {
// 				} else if (e.vertices[0].plate.dx > e.vertices[1].plate.dx) {
// 					vertex.z--;
// 				} else {
// 					vertex.z++;
// 				};
// 				if (e.vertices[0].plate.dy == e.vertices[1].plate.dy) {
// 				} else if (e.vertices[0].plate.dy > e.vertices[1].plate.dy) {
// 					vertex.z--;
// 				} else {
// 					vertex.z++;
// 				};
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
	};
	
	this.fillBasins = function() {
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
				if (v.z < 0) {
					v.basin = false;
				};
				if (v.basin) {
					v.basin = [];
					for (var potential of this.vertices) {
						if (potential.z == v.z && potential.z !== 0) {
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
		};
	};
	
	this.temperature = function() {
		for (tile of this.tiles) {
			tile.temperature = 30 - Math.abs(tile.latitude * 0.5);
			if (tile.z > 0) {
				tile.temperature -= tile.z;
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
			if (tile.downhill !== undefined && tile.z > 0) {
				tile.downhill.drainage += tile.precipitation;
			};
		};
		// Flow drainage down edge network
		this.edges.sort((a, b) => a.topVertex.z !== b.topVertex.z ? a.topVertex.z < b.topVertex.z ? 1 : -1 : 0);
		for (edge of this.edges) {
			if (edge.bottomVertex.downhill !== undefined) {
				edge.bottomVertex.downhill.drainage += edge.drainage;
			} else {
// 				console.log(edge.bottomVertex);
			};
		};
	};
	
	this.biome = function() {
		for (var tile of this.tiles) {
			if (tile.z < 0) {
				tile.biome = 'ocean';
			} else if (tile.vertices[0].z == tile.vertices[1].z && tile.vertices[1].z == tile.vertices[2].z) {
				tile.biome = 'lake';
			} else if (tile.temperature < -5) {
				tile.biome = 'tundra';
			} else if (tile.temperature < 5 && tile.precipitation > 0.15) {
				tile.biome = 'taiga';
			} else if (tile.temperature < 5 && tile.precipitation > 0.05) {
				tile.biome = 'grassland';
			} else if (tile.temperature < 5 && tile.precipitation <= 0.05) {
				tile.biome = 'desert';
			} else if (tile.temperature < 20 && tile.precipitation > 0.7) {
				tile.biome = 'temperate rainforest';
			} else if (tile.temperature < 20 && tile.precipitation > 0.35) {
				tile.biome = 'temperate forest';
			} else if (tile.temperature < 20 && tile.precipitation > 0.07) {
				tile.biome = 'grassland';
			} else if (tile.temperature < 20) {
				tile.biome = 'desert';
			} else if (tile.precipitation > 0.7) {
				tile.biome = 'tropical rainforest';
			} else if (tile.precipitation > 0.35) {
				tile.biome = 'tropical seasonal forest';
			} else if (tile.precipitation > 0.1) {
				tile.biome = 'savanna';
			} else {
				tile.biome = 'desert';
			};
		};
	};
	
	console.time('impacts');
	this.impacts();
	console.timeEnd('impacts');
	
	console.time('tectonics');
	this.tectonics();
	console.timeEnd('tectonics');
	
	this.findTopsAndBottoms();
	
	console.time('coastlines');
	this.coastlines();
	console.timeEnd('coastlines');
	
	console.time('sediment');
	for (i=0;i<20;i++) {
		this.fillBasins();
	};
	console.timeEnd('sediment');
	
	console.time('precipitation');
	this.precipitation();
	console.timeEnd('precipitation');
	
	console.time('temperature');
	this.temperature();
	console.timeEnd('temperature');

	console.time('hydrology');
	this.hydrology();
	console.timeEnd('hydrology');

	console.time('biome');
	this.biome();
	console.timeEnd('biome');

};


