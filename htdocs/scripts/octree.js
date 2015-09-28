/*
The MIT License (MIT)

Copyright (c) 2015 Markus Broecker <broecker@wisc.edu>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/



// Fisher-Yates shuffle
// see: http://bost.ocks.org/mike/shuffle/
function shuffle(array) {
	var m = array.length, t, i;

	// While there remain elements to shuffle…
	while (m) {

		// Pick a remaining element…
		i = Math.floor(Math.random() * m--);

		// And swap it with the current element.
		t = array[m];
		array[m] = array[i];
		array[i] = t;
	}

	return array;
}


function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

var octree = octree || {}


octree.initLoadQueue = function(numRequests) { 
	octree._nodeBacklog = [];

	octree._xmlRequests = [];
	for (var i = 0; i < numRequests; ++i) {
		var request = {xhr:new XMLHttpRequest(), node:null};
		octree._xmlRequests.push(request);
	}
}

octree.updateLoadQueue = function() { 

	//console.log("Updating " + octree._xmlRequests.length + " request.");

	for (var i = 0; i < octree._xmlRequests.length; ++i) { 
		var req = octree._xmlRequests[i];

		// finished loading
		if (req.node != null && req.xhr.readyState === 4 && req.xhr.status === 200) {
			octree.loadBlob(req.node, req.xhr.response);
			req.node = null;

			// update the progress bar
			NProgress.set(0.6);
			NProgress.inc();
		}

		// if ready/empty assign new job
		if (req.node === null && octree._nodeBacklog.length > 0) {

			var tree = octree._nodeBacklog[0];
			octree._nodeBacklog.splice(0, 1);

			req.node = tree;
			req.xhr.open("GET", tree.file + ".blob");
			req.xhr.responseType = "blob";
			req.xhr.send();
		}
	}

	if (octree._nodeBacklog.length === 0) {
		NProgress.done();
		NProgress.configure.showSpinner = false;

	}
}


// loads an octree by putting it onto the loading queue
octree.load = function(tree) {

	if (tree.loaded === false) { 
		tree.loaded = 'in queue';
		octree._nodeBacklog.push(tree);
	}

	if (octree._nodeBacklog.length === 1) {
		NProgress.set(0.1);
	}
}




// loads the blob referenced by a tree node's file attribute and generates
// the vertex buffers.
octree.loadBlob = function(tree, blob) {
	console.assert(blob != undefined);

	if (tree.loaded == 'ongoing' || tree.loaded === true)
		return;

	tree.loaded = 'ongoing';



	//console.log('loaded blob ' + tree.file + '.blob');
	var reader = new FileReader();
	const littleEndian = true;


	const POINT_SIZE = 4*4;

	var pointCount = blob.size / POINT_SIZE;
	
	reader.readAsArrayBuffer(blob);
	reader.onload = function(e) {

		var buffer = reader.result;


		var points = new Float32Array(3*pointCount);
		var colors = new Uint8Array(3*pointCount);

		var dataView = new DataView(buffer, 0);

		for (i = 0; i < pointCount; ++i) {

			var index = i*POINT_SIZE;

			var x = dataView.getFloat32(index+0, littleEndian);
			var y = dataView.getFloat32(index+4, littleEndian);
			var z = dataView.getFloat32(index+8, littleEndian);

			var r = dataView.getUint8(index+12, littleEndian);
			var g = dataView.getUint8(index+13, littleEndian);
			var b = dataView.getUint8(index+14, littleEndian);
			var a = dataView.getUint8(index+15, littleEndian);


			points[i*3+0] = x;
			points[i*3+1] = y;
			points[i*3+2] = z;

			colors[i*3+0] = r;
			colors[i*3+1] = g;
			colors[i*3+2] = b;

		}

		// deferred loading
		tree.pointBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, tree.pointBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);

		tree.colorBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, tree.colorBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

		tree.loaded = true;
	}



	if (octree.loadBlob.pointsLoaded === undefined)
		octree.loadBlob.pointsLoaded = 0;

	octree.loadBlob.pointsLoaded += pointCount;

	document.getElementById("pointsLoaded").innerHTML = "Points: " + numberWithCommas(octree.loadBlob.pointsLoaded);


}


octree.drawNode = function(tree, shader) {
	gl.enableVertexAttribArray(shader.vertexPositionAttribute);
	gl.bindBuffer(gl.ARRAY_BUFFER, tree.pointBuffer);
	gl.vertexAttribPointer(shader.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

	gl.enableVertexAttribArray(shader.vertexColorAttribute);
	gl.bindBuffer(gl.ARRAY_BUFFER, tree.colorBuffer);
	gl.vertexAttribPointer(shader.vertexColorAttribute, 3, gl.UNSIGNED_BYTE, true, 0, 0);


	gl.drawArrays(gl.POINTS, 0, tree.points);
	global.pointsDrawn += tree.points;
}


// draws an octree recursivlely
octree.draw = function(tree, shader, recurse) {

	if (tree.depth > global.octree.maxRecursion)
		return;

	if (global.pointsDrawn > global.maxPointsRendered)
		return;

	// shall we recurse automatically?
	recurse = recurse || true;

	if (tree.visible > 0 && tree.loaded === true) { 
		drawOctreeNode(tree, shader);
	} else if (tree.loaded === false) {

		if (!global.updateVisibility)
			octree.load(tree);
	}

	if (recurse === true && tree.children != null) { 

		for (var i = 0; i < tree.children.length; ++i) { 
			if (tree.children[i].visible > 0)
				octree.draw(tree.children[i], shader);
		}

	}

	
}


// sets a whole tree to be visible
octree.setVisible = function(tree) { 
	tree.visible = 2;
	
	if (tree.children != null) 
		for (var i = 0; i < tree.children.length; ++i)
			octree.setVisible(tree.children[i]);

}

// sets a whole tree to be invisible
octree.setInvisible = function(tree) { 
	tree.visible = 0;

	if (tree.children != null) 
		for (var i = 0; i < tree.children.length; ++i)
			octree.setInvisible(tree.children[i]);
}

// performs view-frustum culling recursively on the tree
octree.updateVisibility = function(tree, matrix) { 
	tree.visible = aabb.clipBox(tree.bbox, matrix);


	if (tree.children != null && tree.depth < global.maxRecursion) {

		for (var i = 0; i < tree.children.length; ++i) {
			// clipping -- test children individually
			if (tree.visible == 1)
				octree.updateVisibility(tree.children[i], matrix);
	
			
			// recursively set everything visible
			if (tree.visible == 2)
				octree.setVisible(tree.children[i]);
			
		}

	}
}

octree.updateScreenArea = function(tree, matrix, resolution) { 
	calculateScreenspaceBounds(tree.bbox, matrix);
    tree.screenArea = calculateScreenspaceArea(tree.bbox, resolution);
}


// returns a list of all visible nodes. Must be run after updateOctreeVisibility
octree.getVisibleNodes = function(tree, list) { 

	if (tree.visible > 0) {
		list.push(tree);

		if (tree.children != null && tree.depth < global.maxRecursion) { 
			for (var i = 0; i < tree.children.length; ++i) { 
				octree.getVisibleNodes(tree.children[i], list);
			}

		}

	}
}

// updates the distance of tree nodes from the camera. 
octree.updateLOD = function(tree, cameraPosition) { 


	tree.lodDistance = vec3.distance(aabb.getCentroid(tree.bbox), cameraPosition);
	//tree.lodDistance = vec3.dot(getCentroid(tree.bbox), cameraPosition);
	const MAX_LOD_DISTANCE = 50000;

	if (tree.children != null) {
		for (var i = 0; i < tree.children.length; ++i) { 
			if (tree.children[i].visible > 0) { 
				octree.updateLOD(tree.children[i], cameraPosition);
			}
			else
				tree.children[i].lodDistance = MAX_LOD_DISTANCE;
		}
	}
}


octree.drawBBoxes = function(tree, shader) {


	if (tree.visible == 0)
		gl.uniform3f(shader.colorUniform, 0.7, 0, 0);
	else if (tree.visible == 2)
		gl.uniform3f(shader.colorUniform, 0.0, 0.7, 0.0);
	else
		gl.uniform3f(shader.colorUniform, 0.7, 0.7, 0.0);

	//drawAABB(tree.bbox, shader);

	if (tree.children != null && tree.depth < global.maxRecursion)
		for (var i = 0; i < tree.children.length; ++i) 
			octree.drawBBoxes(tree.children[i], shader);
	else
		aabb.drawAABB(tree.bbox, shader);
}


// draws the screen-space bounds of the octree
octree.drawBboxBounds = function(tree, shader) { 
	if (tree.visible > 0) {

		if (tree.screenArea)
			gl.uniform1f(shader.areaUniform, tree.screenArea);

		gl.uniform1f(shader.pointsUniform, tree.points);

		drawScreenspaceBounds(tree.bbox, shader);

		if (tree.children != null && tree.depth < global.maxRecursion) { 
			for (var i = 0; i < tree.children.length; ++i)
				octree.drawBboxBounds(tree.children[i], shader);
		}


	}


}

octree.parseJSON = function(jsonUrl) {
	

	var nodes = null;
	
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function () {
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {


			// remove all newline
			var tree = xmlhttp.response.replace(/(\r\n|\n|\r)/gm,"");
			
			nodes = JSON.parse(tree);
		

			//var relinkStart = 	performance.now();
			console.log("Read " + nodes.length + " nodes, relinking tree ... ");


			// create an associative container to speed up searching for nodes
			var nodeDict = {};
			for (var i = 0; i < nodes.length; ++i)
				nodeDict[nodes[i].file] = nodes[i];


			for (var i = 0; i < nodes.length; ++i) {
				var node = nodes[i];

				// check if it's not a leaf node
				if (node.children != null) {

					// relink all children that are not null to actual nodes
					for (var j = 0; j < 8; ++j) {
						if (node.children[j] != null && typeof node.children[j] == "string") {

							var n = nodeDict[node.children[j]];
							console.assert(n != undefined);
							node.children[j] = n;
							n.parent = node;
							
						}

					}	


					// remove all empty children
					for (var j = 7; j >= 0; --j) { 
						if (node.children[j] === null)
							node.children.splice(j, 1);
					}

					
					// randomize the child order
					shuffle(node.children);

				}

				// set loaded flag to false
				node.loaded = false;
				node.pointBuffer = null;
				node.colorBuffer = null;
				node.depth = octree.getDepth(node);

			}

			/*
			var relinkEnd = performance.now();
			console.log("Relink time: " + (relinkEnd-relinkStart) + " ms")
			*/
			// append the full path to all file names
			var basename = jsonUrl.substring(0, jsonUrl.lastIndexOf("/")+1);

			for (i = 0; i < nodes.length; ++i)
				nodes[i].file = basename + nodes[i].file;


			// find the root node
			var root = nodeDict["node-root"];
			console.log("Loaded tree.");

			root.numNodes = nodes.length;

			// load the root node
			octree.load(root);

			// global 
			geometry.octree = root;

			// reset visibility
			octree.setInvisible(root);

			global.updateVisibility = true;

			return root;
		}
	}

	xmlhttp.open("GET", jsonUrl, true)
	xmlhttp.send();
	
}

// returns the depth of a node in the tree
octree.getDepth = function(tree) { 

	if (tree.depth != undefined)
		return tree.depth;
	else {

		if (tree.parent === null)
			return 0;
		else 
			return 1 + octree.getDepth(tree.parent);
	}
}
