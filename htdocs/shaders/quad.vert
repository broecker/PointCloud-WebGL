attribute vec2 positionIn;
varying vec2 texcoords;

void main()
{

	gl_Position = vec4(positionIn*2.0 - vec2(1.0), 0.0, 1.0);
	texcoords = positionIn.xy;

}
