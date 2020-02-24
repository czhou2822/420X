#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D uSampler;
uniform vec2 resolution;

void main() 
{
  vec4 textureColor = texture2D( uSampler, gl_FragCoord.xy / resolution ).rgba;
  gl_FragColor = vec4( vec3(textureColor.r), 1. );
  //gl_FragColor = vec4( textureColor.r, 1. );
}