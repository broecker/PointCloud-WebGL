attribute vec3 positionIn;
attribute vec3 colorIn;

uniform mat4 viewMatrix;
uniform mat4 projMatrix;

//uniform float pointSize;
uniform float viewportHeight;

varying vec3 color;
void main()
{
	gl_Position = projMatrix * viewMatrix * vec4(positionIn, 1.0);

	color = colorIn;
		
	// conversion factor converts from m to cm
	const float pointSize = 0.01;
	gl_PointSize = (viewportHeight * pointSize) / gl_Position.w;
	
}