precision highp float;
uniform float projectedArea;
uniform float pointsContained;

void main()
{
	vec3 red = vec3(1.0, 0.0, 0.0);
	vec3 grn = vec3(0.0, 1.0, 0.0);

	float density = sqrt(pointsContained / projectedArea);

	vec3 color = mix(grn, red, step(1.24, density));

	gl_FragColor = vec4(color, 1.0);
}
