function Map(sizeX,sizeY,step) {
	if (sizeX == undefined) {sizeX = 1000};
	if (sizeY == undefined) {sizeY = 800};
	if (step == undefined) {step = 33};
	this.sizeX = sizeX;
	this.sizeY = sizeY;
	this.step = step;
	this.vertices = [];
	this.edges = [];
	this.edgeLibrary = {};
	this.tiles = [];
	this.basins = [];
	var i, x, y;

	// Random Seed Vertices
	for (var x=step;x<sizeX;x+=step) {
		for (var y=step;y<sizeX;y+=step) {
			this.vertices.push([x+Math.random()*step*0.9,y+Math.random()*step*0.9]);
		};
	};
	for (x=0;x<sizeX;x+=step) {
		this.vertices.push([x,0]);
		this.vertices.push([x,sizeY]);
	}
	for (y=0;y<sizeY;y+=step) {
		this.vertices.push([0,y]);
		this.vertices.push([sizeX,y]);
	};

	console.time("triangulate");
	this.triangles = Delaunay.triangulate(this.vertices);
	console.timeEnd("triangulate");
	
	// Turn Vertices from Arrays into Objects (and add seed z)
	for (i in this.vertices) {
		this.vertices[i] = {
			x: this.vertices[i][0],
			y: this.vertices[i][1],
			z: Math.random() * 0.5 - 0.25,
			edgeLibrary: {},
			index: i,
		};
	};

	console.time('compiling tiles and edges');
	for (i = this.triangles.length; i; ) {
		var newTile = {vertices:[]};
		newTile.precipitation = 1;
		var vertexIndices = [];
		--i;newTile.vertices.push(this.vertices[this.triangles[i]]);vertexIndices.push(this.triangles[i]);
		--i;newTile.vertices.push(this.vertices[this.triangles[i]]);vertexIndices.push(this.triangles[i]);
		--i;newTile.vertices.push(this.vertices[this.triangles[i]]);vertexIndices.push(this.triangles[i]);
		this.tiles.push(newTile);
		vertexIndices.sort();
		this.edgeLibrary['edgeA'+vertexIndices[0]+'B'+vertexIndices[1]] = {vertices:[this.vertices[vertexIndices[0]],this.vertices[vertexIndices[1]]]};
		this.edgeLibrary['edgeA'+vertexIndices[0]+'B'+vertexIndices[2]] = {vertices:[this.vertices[vertexIndices[0]],this.vertices[vertexIndices[2]]]};
		this.edgeLibrary['edgeA'+vertexIndices[1]+'B'+vertexIndices[2]] = {vertices:[this.vertices[vertexIndices[1]],this.vertices[vertexIndices[2]]]};
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
		for (potential of this.tiles) {
			var m0 = Math.min(0,potential.vertices.indexOf(tile.vertices[0]));
			var m1 = Math.min(0,potential.vertices.indexOf(tile.vertices[1]));
			var m2 = Math.min(0,potential.vertices.indexOf(tile.vertices[2]));
			if (m0 + m1 + m2 > -3) {
				tile.adjacent.push(potential);
			};
			if (m0 + m1 + m2 > -2) {
				tile.neighbors.push(potential);
			};
		};
	};
	console.timeEnd("neighbors");
	
	this.tectonics = function() {
		for (var i=0;i<10*(this.sizeX,this.sizeY)/this.step;i++) {
			var plate = {
				cx: Math.random() * this.sizeX*2 - this.sizeX*0.5,
				cy: Math.random() * this.sizeY*2 - this.sizeY*0.5,
				r: (Math.random()/2 + 0.5) * Math.min(this.sizeX,this.sizeY) * 0.25,
				dz: 4 * Math.random() - 2,
			};
			if (plate.cx < 0 || plate.cx > this.sizeX || plate.cy < 0 || plate.cy > this.sizeY) {
				plate.dz = -1 * Math.abs(plate.dz);
			};
			plate.c2x = plate.cx + Math.random() * plate.r - plate.r/2;
			plate.c2y = plate.cy + Math.random() * plate.r - plate.r/2;
			plate.r2 = plate.r * Math.random() * 0.9;
			for (v of this.vertices) {
				if (Math.pow(Math.pow(v.x - plate.cx,2)+Math.pow(v.y - plate.cy,2),0.5) < plate.r) {
					if ((Math.pow(Math.pow(v.x - plate.c2x,2)+Math.pow(v.y - plate.c2y,2),0.5) > plate.r2)) {
						v.z += plate.dz;
					};
				};
			};
		};
	};
	
	this.findTopAndBottoms = function() {
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
			var pos = 0, neg = 0;
			for (var v of tile.vertices) {
				if (v.z > 0) {
					pos++;
				} else if (v.z < 0) {
					neg++;
				};
			};
			tile.height = (tile.vertices[0].z+tile.vertices[1].z+tile.vertices[2].z)/3;
			if (pos == 1 || pos == 2) {
				if (tile.height > 0) {
					for (v of tile.vertices) {
						v.z = Math.max(v.z,0);
					};
				} else {
					for (v of tile.vertices) {
						v.z = Math.min(v.z,0);
					};
				};
			};
			tile.height = (tile.vertices[0].z+tile.vertices[1].z+tile.vertices[2].z)/3;
		};
	};
	
	this.fillBasins = function() {
		this.findTopAndBottoms();
		for (var v of this.vertices) {
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
					console.log('no lowest vertex?');
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
				v.downhill = e;
			};
		};
	};
	
	this.hydrology = function() {
		this.findTopAndBottoms();
		console.time('flow');
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
		console.timeEnd('flow');
	};
	
	console.time('tectonics');
	this.tectonics();
	console.timeEnd('tectonics');
	
	this.coastlines();
	
	console.time('sediment');
	for (i=0;i<10;i++) {
		this.fillBasins();
	};
	console.timeEnd('sediment');

	this.hydrology();

};


