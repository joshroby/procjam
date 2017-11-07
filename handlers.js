var handlers = {

	load: function() {
		var pageContents = view.pageContents();
		document.body.innerHTML = '';
		for (var element of pageContents) {
			document.body.appendChild(element);
		};
		saveSVG(document.getElementById('mapSVG'),'map');
	},

	newMap: function() {
// 		var sizeX = document.getElementById('sizeInput').value * 200;
		var sizeX = 1000;
		var sizeY = sizeX * 0.61;
		var step = 12 - document.getElementById('resolutionInput').value;
		var impacts = document.getElementById('impactsInput').value - 1;
		var tectonics = document.getElementById('tectonicsInput').value;
		var wetness = document.getElementById('wetnessInput').value;
		var orbit = document.getElementById('orbitInput').value;
		map = new Map(sizeX,sizeY,step,impacts,tectonics,wetness,orbit);
		view.currentZoom.viewBox.width = map.sizeX;
		view.currentZoom.viewBox.height = map.sizeY;
		detailsDiv = document.getElementById('detailsDiv').innerHTML = '<h3>Generating...</h3>'
		var timedEvent = setTimeout(handlers.newMapTriangulate,10);
	},
	
	newMapTriangulate: function() {
		map.triangulate();
		handlers.displayProgress('Compiling Tiles...');
		var timedEvent = setTimeout(handlers.newMapCompileTiles,10);
	},
	
	newMapCompileTiles: function() {
		map.compileTiles();
		handlers.displayProgress('Finding Neighbors...');
		var timedEvent = setTimeout(handlers.newMapNeighbors,10);
	},
	
	newMapNeighbors: function() {
		map.neighbors();
		handlers.displayProgress('Impact Events...');
		var timedEvent = setTimeout(handlers.newMapImpacts,10);
	},
	
	newMapImpacts: function() {
		map.impacts();
		handlers.displayProgress('Tectonic Shifts...');
		var timedEvent = setTimeout(handlers.newMapTectonics,10);
	},
	
	newMapTectonics: function() {
		map.tectonics();
		handlers.displayProgress('Eroding Coastlines...');
		var timedEvent = setTimeout(handlers.newMapCoastlines,10);
	},
	
	newMapCoastlines: function() {
		map.coastlines();
		handlers.displayProgress('Sedimentation...');
		var timedEvent = setTimeout(handlers.newMapFillBasins,10);
	},
	
	newMapFillBasins: function() {
		var basinsNeedFilling = 1;
		for (i=0;i<20;i++) {
			if (basinsNeedFilling > 0) {
				basinsNeedFilling = map.fillBasins();
			};
		};
		handlers.displayProgress('Calculating Precipitation...');
		var timedEvent = setTimeout(handlers.newMapPrecipitation,10);
	},
	
	newMapPrecipitation: function() {
		map.precipitation();
		handlers.displayProgress('Calculating Temperature...');
		var timedEvent = setTimeout(handlers.newMapTemperature,10);
	},
	
	newMapTemperature: function() {
		map.temperature();
		handlers.displayProgress('Hydrology...');
		var timedEvent = setTimeout(handlers.newMapHydrology,10);
	},
	
	newMapHydrology: function() {
		map.hydrology();
		handlers.displayProgress('Determining Biomes...');
		var timedEvent = setTimeout(handlers.newMapBiome,10);
	},

	newMapBiome: function() {
		map.biome();
		handlers.displayProgress('Coloring...');
		var timedEvent = setTimeout(handlers.newMapColoring,10);
	},

	newMapColoring: function() {
		map.physicalColor();
		view.renderMap(map,'physical');
		document.getElementById('saveMapDiv').innerHTML = '';
		saveSVG(document.getElementById('mapSVG'),'Save');
	},
	
	displayProgress: function(message) {
		var detailsDiv = document.getElementById('detailsDiv');
		detailsDiv.innerHTML += '<p>' + message;
	},

};

function saveSVG(svgElement, name) {
    svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    var svgData = svgElement.outerHTML;
    var preface = '<?xml version="1.0" standalone="no"?>\r\n';
    var svgBlob = new Blob([preface, svgData], {type:"image/svg+xml;charset=utf-8"});
    var svgUrl = URL.createObjectURL(svgBlob);
    var downloadLink = document.createElement("a");
    downloadLink.innerHTML = '<button>Export Map as SVG</button>';
    downloadLink.href = svgUrl;
    downloadLink.download = name;
    document.getElementById('saveMapDiv').appendChild(downloadLink);
}
