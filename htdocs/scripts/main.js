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


var canvas;
var gl = null; // A global variable for the WebGL context


// store global variables
var global = global || {};
global.enableGrid = true;
global.enableBBox = false;
global.enableFXAA = true;

global.viewMatrix = mat4.create();
global.projMatrix = mat4.create();
global.modelViewProjection = mat4.create();
global.inverseModelViewProjection = mat4.create();

global.camera = null;
global.mouse = {button:[false, false, false], lastPosition:[0,0]};
global.touches = null;
global.shiftHeld = false;
global.ctrlHeld = false;


global.stats = null;

global.maxConcurrentLoads = 20;

global.renderTarget = null;
global.renderTargetResolution = [1024, 1024];

global.clearColor = [0, 0, 0.2];


global.videoElement = null;

// store shaders
var shaders = shaders || {};

// store what we want to render
var geometry = geometry || {};
geometry.grid = null;

window.mobilecheck = function() {
  var check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
}

function isMobile() {
    if (navigator.userAgent.match(/Android/i)
            || navigator.userAgent.match(/iPhone/i)
            || navigator.userAgent.match(/iPad/i)
            || navigator.userAgent.match(/iPod/i)
            || navigator.userAgent.match(/BlackBerry/i)
            || navigator.userAgent.match(/Windows Phone/i)
            || navigator.userAgent.match(/Opera Mini/i)
            || navigator.userAgent.match(/IEMobile/i)
            ) {
        return true;
    }
}

// initializes the canvas and webgl
function initWebGL(canvas) {  
  try {
    // Try to grab the standard context. If it fails, fallback to experimental.
    gl = canvas.getContext("webgl", {preserveDrawingBuffer : true}) || canvas.getContext("experimental-webgl", {preserveDrawingBuffer : true});
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;


  }
  catch(e) {}
  
  // If we don't have a GL context, give up now
  if (!gl) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
    gl = null;
  }
  
  return gl;
}

// resizes the canvas to fill the whole window
function resizeCanvas() {

  //debugger;

  var width = canvas.clientWidth;
  var height = canvas.clientHeight;
  
  if (canvas.width != width || canvas.height != height) {

    // Change the size of the canvas to match the size being displayed
    canvas.width = width;
    canvas.height = height;

  } 

  gl.viewport(0, 0, width, height);
  global.viewport = [0, 0, width, height];

  console.log("Resizing canvas to " + width + "x" + height);

}


function drawFBO() {

  // display the fbo 
  gl.disable(gl.DEPTH_TEST);

  shader = shaders.quadShader;
  if (shader === null)
    return;


  if (global.enableFXAA && !global.camera.isMoving && !(shaders.fxaaShader === null))
    shader = shaders.fxaaShader;

  gl.useProgram(shader);
  gl.activeTexture(gl.TEXTURE0);
  
  gl.bindTexture(gl.TEXTURE_2D, global.renderTarget.texture);
  gl.uniform1i(shader.colormapUniform, 0);
  gl.uniform2f(shader.resolutionUniform, global.renderTarget.width, global.renderTarget.height);

  geometry.drawFullscreenQuad(shader);


}



function inititalizeFBO() {
  // also clear the fbo
  bindFBO(global.renderTarget);

  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.clearColor(global.clearColor[0], global.clearColor[1], global.clearColor[2], 1.0); 

  // draw the skybox
  if (!(shaders.skyboxShader === null)) {

    gl.depthMask(false);
    gl.disable(gl.DEPTH_TEST);

    gl.useProgram(shaders.skyboxShader);
    gl.uniformMatrix4fv(shaders.skyboxShader.inverseMVPUniform, false, global.inverseModelViewProjection);

    geometry.drawFullscreenQuad(shaders.skyboxShader);


    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.depthFunc(gl.LEQUAL);
  }

  // draw all static elements ... 
  if (global.enableGrid && !(shaders.gridShader === null))
    geometry.drawGrid();



  //if (global.mouse.button[0] || global.mouse.button[2])
  if (camera.isMoving && (!shaders.objectShader === null))
    drawCameraFocus(gl, shaders.objectShader, global.projMatrix, global.viewMatrix, camera);



  shader = shaders.gridShader;
  if (global.enableBBox && geometry.octree && !(shader === null)) { 
    gl.useProgram(shader);
    gl.enableVertexAttribArray(shader.vertexPositionAttribute);

    gl.uniform3f(shader.colorUniform, 0.7, 0.7, 0.0);
    gl.uniformMatrix4fv(shader.projMatrixUniform, false, global.projMatrix);
    gl.uniformMatrix4fv(shader.viewMatrixUniform, false, global.viewMatrix);

    octree.drawBBoxes(geometry.octree, shader);

  }


  disableFBO(global.renderTarget);
}

function updateFBO() {

  bindFBO(global.renderTarget);

  gl.depthMask(true);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);


  var shader = shaders.pointsShader;
  if (geometry.octree && shader) {
    // draw the points
    gl.useProgram(shader);

    gl.uniform1f(shader.pointSizeUniform, global.pointSize);
    gl.uniformMatrix4fv(shader.projMatrixUniform, false, global.projMatrix);
    gl.uniformMatrix4fv(shader.viewMatrixUniform, false, global.viewMatrix);


    var viewportHeight = canvas.height / (2.0 * Math.tan(0.5*Math.PI / 180 * global.camera.fovy));
    viewportHeight = 1.15 * 1024.0;
    gl.uniform1f(shader.viewportHeightUniform, viewportHeight);


    global.pointsDrawn = 0;


    for (var i = 0; i < global.visibleList.length && global.pointsDrawn < global.maxPointsRendered; ++i) {
      var node = global.visibleList[i];

      if (node.loaded === true) {
        octree.drawNode(node, shader);
        global.visibleList.splice(i, 1);
      } else {

        if (node.loaded === false && node.depth <= global.maxRecursion) {
          octree.load(node);

        }

      }
    }


  }


  disableFBO(global.renderTarget);

}



var lastTime = 0;
function tick() {
  var time = new Date().getTime();
  
  if (lastTime !== 0) {
    var dt = (time - lastTime) / 1000.0;

  }
  lastTime = time;
  
}

function updateCamera() {
  
  camera.aspect = canvas.clientWidth / canvas.clientHeight;

   //  setup the camera matrices
  setProjectionMatrix(camera, global.projMatrix);
  setViewMatrix(camera, global.viewMatrix);


  mat4.multiply(global.modelViewProjection, global.projMatrix, global.viewMatrix);
  mat4.invert(global.inverseModelViewProjection, global.modelViewProjection);

}

function updateVisibility() {

  // build a new visible set
  global.visibleList = [];

  if (geometry.octree) {

    var mat = mat4.create();
    mat4.multiply(mat, global.projMatrix, global.viewMatrix);

    octree.setInvisible(geometry.octree);
    octree.updateVisibility(geometry.octree, mat);
    octree.updateLOD(geometry.octree, getPosition(global.camera));
    octree.getVisibleNodes(geometry.octree, global.visibleList);
  }


  if (global.visibleList.length > 0) {

    global.visibleList.sort(function(a,b) {
      return a.lodDistance*a.depth - b.lodDistance*b.depth;
    });

    /*
    // REMOVE ME -- just for testing
    global.visibleList = global.visibleList.filter(function(node) {
      return node.depth <= 1;
    });
    */


    if (global.enableDensityCulling) {

      global.visibleList.forEach(function(node) {
        octree.updateScreenArea(node, global.modelViewProjection, [global.renderTarget.width, global.renderTarget.height]);
      });


      var oldSize = global.visibleList.length;
      global.visibleList = global.visibleList.filter(function(node) {
        var density2 = node.points / node.screenArea;
        return density2 < global.densityTreshold*global.densityTreshold;
      });

      console.log("Removed " + (oldSize-global.visibleList.length) + " nodes, " + global.visibleList.length + " remaining");

    }

  }



  global.updateVisibility = false;
}



function loop() {
  global.stats.begin();

  tick();

 // start a new frame
  if (global.updateVisibility) {

    if (loop._runonce === undefined) {
      loop._runonce = 'done';
      global.updateVisibility = true;

      resizeCanvas();

    }

    updateVisibility();

    updateCamera();
    inititalizeFBO();
  }

  // update the fbo
  if (global.visibleList.length > 0) {

      updateFBO();

  }

  drawFBO();
  
 
  global.stats.end();

  window.requestAnimationFrame(loop, canvas);
  
    
} 


// mouse callback functions follow .... 
function handleMouseDown(event) {
  event.preventDefault();

  global.mouse.button[event.button] = true;
  global.mouse.lastPosition = [event.clientX, event.clientY];

  startCameraMove();
}

function handleMouseUp(event) {
  global.mouse.button[event.button] = false;
  stopCameraMove();

}

function handleMouseMotion(event) {
  var mousePosition = [event.clientX, event.clientY];

  var deltaX = (mousePosition[0] - global.mouse.lastPosition[0]) / canvas.clientWidth;
  var deltaY = (mousePosition[1] - global.mouse.lastPosition[1]) / canvas.clientHeight;
 
  // scale to -1..1
 // deltaY *= 180.0 / Math.PI;
  

  if (global.mouse.button[0]) {

    if (global.shiftHeld === true) 
      panCamera(global.camera, deltaX*4.0, -deltaY*4.0);
    else if (global.ctrlHeld === true)
      moveCameraTowardsTarget(global.camera, deltaY*10);
    else
      rotateCameraAroundTarget(global.camera, deltaY*Math.PI, -deltaX*Math.PI);

    global.updateVisibility = true;
  }

  else if (global.mouse.button[1]) {
    moveCameraTowardsTarget(global.camera, deltaY*10);
    global.updateVisibility = true;
  }

  else if (global.mouse.button[2]) {
    panCamera(global.camera, deltaX*4.0, -deltaY*4.0);
    global.updateVisibility = true;
  }




  global.mouse.lastPosition = mousePosition;
}

function handleMouseWheel(event) {
  
  var delta = event.wheelDelta* 0.05;;
 moveCameraTowardsTarget(global.camera, delta);

  global.updateVisibility = true;
}


// touch callback functions follow .... 
function handleTouchStart(event) {
  event.preventDefault();

  global.mouse.button[0] = true;
  var touch = event.targetTouches[0];

  global.touches = event.targetTouches;
  global.prevTouchDelta = undefined;
  global.prevTouchCenter = undefined;

  global.mouse.lastPosition = [canvas.clientWidth-touch.pageX, touch.pageY];
  startCameraMove();
}

function handleTouchEnd(event) {
  global.mouse.button[event.button] = false;

  global.touches = event.targetTouches;
  stopCameraMove();
    
}

function handleTouchMove(event) {


  // rotation
  if (event.targetTouches.length == 1) {

    var touch = event.targetTouches[0];

    var mousePosition = [canvas.clientWidth-touch.pageX, touch.pageY];

    var deltaX = (mousePosition[0] - global.mouse.lastPosition[0]) / canvas.clientWidth;
    var deltaY = (mousePosition[1] - global.mouse.lastPosition[1]) / canvas.clientHeight;
   
    // scale to -1..1
   // deltaY *= 180.0 / Math.PI;
    
    rotateCameraAroundTarget(global.camera, deltaY*Math.PI, deltaX*Math.PI);

  } else {

    var center =  {minx:event.targetTouches[0].pageX, maxx:event.targetTouches[0].pageX, miny:event.targetTouches[0].pageY, maxy:event.targetTouches[0].pageY};
    for (var i = 1; i < event.targetTouches.length; ++i) {
      
      center.minx = Math.min(center.minx, event.targetTouches[i].pageX);
      center.maxx = Math.max(center.maxx, event.targetTouches[i].pageX);
      center.miny = Math.min(center.miny, event.targetTouches[i].pageY);
      center.maxy = Math.max(center.maxy, event.targetTouches[i].pageY);
    }

    var delta = [center.maxx-center.minx, center.maxy-center.miny];
    delta = Math.sqrt(delta[0]*delta[0] + delta[1]*delta[1]);


    var center = [(center.maxx+center.minx)*0.5, (center.maxy+center.miny)*0.5];


    var mode = 'pan';
    if (delta > 100.0)
      mode = 'zoom';

    if (global.prevTouchCenter != undefined && mode === 'pan') {

      var move = [center[0] - global.prevTouchCenter[0], center[1] - global.prevTouchCenter[1]]; 
      move[0] *= 0.01;
      move[1] *= -0.01;


      panCamera(global.camera, move[0], move[1]);


    }

    if (global.prevTouchDelta != undefined && mode === 'zoom') { 

      var factor = global.prevTouchDelta-delta;
      moveCameraTowardsTarget(global.camera, factor*0.01);
    }



    global.prevTouchCenter = center;
    global.prevTouchDelta = delta;

    

  }



  global.touches = event.targetTouches;
  global.mouse.lastPosition = mousePosition;
  global.updateVisibility = true;
}


function resetCamera() {
  
  global.updateVisibility = true;

  global.camera = createOrbitalCamera();
  global.camera.radius = 20.0;
}

function startCameraMove() {
  global.camera.isMoving = true;
  global.renderTargetResolution.old = global.renderTargetResolution;
  resizeFBO(global.renderTarget, [global.renderTargetResolution[0]/2, global.renderTargetResolution[1]/2]);

  global.updateVisibility = true;

}

function stopCameraMove() {
  global.camera.isMoving = false;
  resizeFBO(global.renderTarget, global.renderTargetResolution.old);

  global.updateVisibility = true;
}


function increaseDetail() { 
  ++global.maxRecursion;
  global.updateVisibility =  true;
}

function decreaseDetail() { 
  -- global.maxRecursion;
  if (global.maxRecursion < 0)
    global.maxRecursion = 0; 

  global.updateVisibility = true;
}


function handleKeydown(event) { 

  // 'g'
  if (event.keyCode == 71) {
    global.enableGrid = !global.enableGrid;
    global.updateVisibility = true;
  }

  // up
  if (event.keyCode == 38)
    panCamera(global.camera, 0, 0, -2.0);

  // down
  if (event.keyCode == 40) 
    panCamera(global.camera, 0, 0, 2.0);

  // left
  if (event.keyCode == 37)
    panCamera(global.camera, 2.0, 0, 0);

  // right
  if (event.keyCode == 39)
    panCamera(global.camera, -2, 0, 0);

  // page down
  if (event.keyCode == 34)
    panCamera(global.camera, 0, -2, 0);
  //page up
  if (event.keyCode == 33)
    panCamera(global.camera, 0, 2, 0);

  // 'c' - center camera
  if (event.keyCode == 67) {
    resetCamera();
  }

  // 'a' -- increase recursion level
  if (event.keyCode == 65) {
    increaseDetail();
  }

  // 'z' -- decrease recursion level
  if (event.keyCode == 90) {
    decreaseDetail();
  }

  // 'x' -- enable multisampling
  if (event.keyCode == 88) {
    global.enableFXAA = !global.enableFXAA;
  }



  // b
  if (event.keyCode == 66) {
    global.enableBBox = !global.enableBBox;
    global.updateVisibility = true;
  }

  // 'shift'
  if (event.keyCode == 16)
    global.shiftHeld = true;

  // 'ctrl'
  if (event.keyCode == 17) 
    global.ctrlHeld = true;
  
  // 'space bar'
  if (event.keyCode == 32)
    toggleAnimation();

  
}

function handleKeyup(event) {
  if (event.keyCode == 16)
    global.shiftHeld = false;

  // 'ctrl'
  if (event.keyCode == 17) 
    global.ctrlHeld = false;

}



function init(datapath, shaderpath) {
  canvas = document.getElementById("canvas");
  
  canvas.addEventListener("webglcontextlost", function(event) {
    event.preventDefault();

    console.error("WebGL context lost!");

  }, false);



  gl = initWebGL(canvas);      // Initialize the GL context
  resizeCanvas();

  // register mouse functions
  canvas.onmousedown = handleMouseDown;
  canvas.onmouseup = handleMouseUp;
  canvas.onmousemove = handleMouseMotion;
  canvas.onmousewheel = handleMouseWheel;
  document.addEventListener("keydown", handleKeydown, false);
  document.addEventListener("keyup", handleKeyup, false);

  
  canvas.addEventListener("touchstart", handleTouchStart, false);
  canvas.addEventListener("touchmove", handleTouchMove, false);
  canvas.addEventListener("touchend", handleTouchEnd, false);
  

  window.addEventListener("resize", resizeCanvas);


  // disables the right-click menu
  document.oncontextmenu = function() {
    return false;
  }

  global.camera = createOrbitalCamera();
  global.camera.radius = 20.0;

  shader.loadAll(shaders, shaderpath);
  geometry.createGridBuffer();

  // create FPS meter
  global.stats = new Stats();
  global.stats.setMode(0);
  global.stats.domElement.style.position = 'absolute';
  global.stats.domElement.style.right = '5px';
  global.stats.domElement.style.bottom = '5px';
  //document.body.appendChild(global.stats.domElement);


  global.updateVisibility = true;


  if (isMobile()) {

    global.renderTarget = createFBO(1024, 1024);
    global.maxPointsRendered = 50000;
    global.clearColor = [0, 0, 0.2, 0.0]
    global.maxRecursion = 1;
    global.maxConcurrentLoads = 3;

  } else { 
    global.renderTarget = createFBO(1024, 1024);
    global.maxPointsRendered = 250000;
    global.clearColor = [0.1, 0.2, 0.3, 0];
    global.maxRecursion = 2;
    global.maxConcurrentLoads = 8;

  }


  // initialize octree
  octree.initLoadQueue(global.maxConcurrentLoads);
  geometry.octree = octree.parseJSON(datapath);

  window.setInterval(octree.updateLoadQueue, 200);



  // create trickle progress bar
  NProgress.start();

}

function toggleGrid() { 
  global.enableGrid = !global.enableGrid;
  global.updateVisibility = true;
}

function toggleBBox() { 
  global.enableBBox = !global.enableBBox;
  global.updateVisibility = true;
}


/// saves the current opengl canvas in an image and opens it in a new window 
function saveScreenShot() {
  var image = new Image();
  image.src = canvas.toDataURL("image/png");
   window.open(image.src);  
}

function toggleFXAA() { 
  global.enableFXAA = !global.enableFXAA;
}

function getBasePath(address) { 
  var basepath = address.substring(0, address.lastIndexOf("/"));
  basepath = basepath.substring(0, basepath.lastIndexOf("/")+1);

  return basepath;
}


function main(datapath, shaderpath) {
  
  init(datapath, shaderpath);



  loop();
}
