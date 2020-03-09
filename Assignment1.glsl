

uniform vec2 u_resolution;

uniform float u_time;

float satuation = 0.5;

float brightness = 0.5;

float color = 0.5;

vec3 HSBColor;


//  Function from Iñigo Quiles

//  https://www.shadertoy.com/view/MsS3Wc

vec3 hsb2rgb( in vec3 c )

{

    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),

                             6.0)-3.0)-1.0,

                     0.0,

                     1.0 );

    rgb = rgb*rgb*(3.0-2.0*rgb);

    return c.z * mix( vec3(1.0), rgb, c.y);

}


void main()

{

    vec2 st = uvN();

    

    float shifting = time / 9.;

    vec2 toCenter = vec2(0.5)-st;

    float angle = atan(toCenter.y,toCenter.x);

    float radius =  length(toCenter)*5.0;

   

    

    

    color  = (angle/6.28) + shifting;

    

    satuation = radius + sin(3.*time) + cos(2.*time);

    

    HSBColor = vec3(color, satuation, brightness);

    

    vec3 outColor  = hsv2rgb(HSBColor);

    

    gl_FragColor = vec4(outColor,1.0);

}