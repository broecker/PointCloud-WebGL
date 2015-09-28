precision mediump float;

uniform sampler2D colormap;
varying vec2 texcoords;


void main()
{
	gl_FragColor = texture2D(colormap, texcoords);

}
