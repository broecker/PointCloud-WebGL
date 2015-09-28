precision mediump float;

void main()
{
	vec3 color = vec3(1.0, 1.0, 0.0); //texture2D(geometryMap, texcoords).rgb;
	gl_FragColor = vec4(color, 1.0);
}
