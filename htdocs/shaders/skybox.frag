precision mediump float;

varying vec2 texcoords;
varying vec3 viewDir;


void main()
{
	vec3 V = normalize(viewDir);

	vec3 horizonColor = vec3(0.8, 0.8, 0.9);
	vec3 bottomColor = vec3(0.3, 0.3, 0.4);
	vec3 topColor = vec3(0.7, 0.7, 1.0);

	vec3 color = V;
	if (V.y > 0.0)
		color = mix(horizonColor, topColor, V.y);
	else
		color = mix(horizonColor, bottomColor, -V.y);

	gl_FragColor = vec4(color, 1.0);

}	