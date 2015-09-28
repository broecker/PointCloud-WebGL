attribute vec3 positionIn;
attribute vec3 colorIn;

uniform mat4 viewMatrix;
uniform mat4 projMatrix;

varying vec3 color;

void main()
{
	gl_Position = projMatrix * viewMatrix * vec4(positionIn, 1.0);
	color = colorIn;
}