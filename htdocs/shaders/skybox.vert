attribute vec2 positionIn;
varying vec2 texcoords;
varying vec3 viewDir;

uniform mat4 inverseMVP;

void main()
{

	vec4 worldPos = inverseMVP * vec4(positionIn, 1.0, 1.0);
	worldPos /= worldPos.w;

	vec4 cameraPos = inverseMVP * vec4(0.0, 0.0, 0.0, 1.0);
	cameraPos /= cameraPos.w;

	viewDir = worldPos.xyz - cameraPos.xyz; 

	gl_Position = vec4(positionIn*2.0 - vec2(1.0), 0.0, 1.0);
	texcoords = positionIn.xy;

}