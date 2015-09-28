
precision mediump float;

attribute vec2 positionIn;
varying vec2 texcoords;

//texcoords computed in vertex step
//to avoid dependent texture reads
varying vec2 v_rgbNW;
varying vec2 v_rgbNE;
varying vec2 v_rgbSW;
varying vec2 v_rgbSE;
varying vec2 v_rgbM;

uniform vec2 resolution;


//To save 9 dependent texture reads, you can compute
//these in the vertex shader and use the optimized
//frag.glsl function in your frag shader.
//This is best suited for mobile devices, like iOS.
void calculateTexcoords(vec2 fragCoord, vec2 resolution,
	out vec2 v_rgbNW, out vec2 v_rgbNE,
	out vec2 v_rgbSW, out vec2 v_rgbSE,
	out vec2 v_rgbM) {
	vec2 inverseVP = 1.0 / resolution.xy;
	v_rgbNW = (fragCoord + vec2(-1.0, -1.0)) * inverseVP;
	v_rgbNE = (fragCoord + vec2(1.0, -1.0)) * inverseVP;
	v_rgbSW = (fragCoord + vec2(-1.0, 1.0)) * inverseVP;
	v_rgbSE = (fragCoord + vec2(1.0, 1.0)) * inverseVP;
	v_rgbM = vec2(fragCoord * inverseVP);
}

void main()
{

	gl_Position = vec4(positionIn*2.0 - vec2(1.0), 0.0, 1.0);
	texcoords = positionIn.xy;

	//compute the texture coords and send them to varyings
	vec2 fragCoord = texcoords * resolution;
	calculateTexcoords(fragCoord, resolution, v_rgbNW, v_rgbNE, v_rgbSW, v_rgbSE, v_rgbM);

}
