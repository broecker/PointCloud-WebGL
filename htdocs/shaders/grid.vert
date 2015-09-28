attribute vec3 positionIn;

uniform mat4 viewMatrix;
uniform mat4 projMatrix;

void main()
{
	gl_Position = projMatrix * viewMatrix * vec4(positionIn, 1.0);
	gl_PointSize = 1.0;

}