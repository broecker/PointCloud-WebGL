attribute vec2 texcoord;

uniform mat4 viewMatrix;
uniform mat4 projMatrix;

uniform sampler2D geometryMap;

uniform vec3 cloudScale;
uniform vec3 cloudBias;


void main()
{
	
	vec3 pos = texture2D(geometryMap, texcoord).xyz;
	pos *= cloudScale;
	pos += cloudBias;
	

	//vec3 pos = vec3(texcoord, 0.0);

	gl_Position = projMatrix * viewMatrix * vec4(pos, 1.0);
	gl_PointSize = 2.0;
}