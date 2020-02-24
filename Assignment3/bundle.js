(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const glslify = require( 'glslify' )
let gl, framebuffer,
    simulationProgram, drawProgram,
    uTime, uSimulationState,
    textureBack, textureFront,uIsSimulationOn,
    dimensions = { width:400, height:400 }

window.onload = function() 
{
  const canvas = document.getElementById( 'gl' )
  gl = canvas.getContext( 'webgl' )
  canvas.width = dimensions.width 
  canvas.height = dimensions.height 
  
  // define drawing area of webgl canvas. bottom corner, width / height
  // XXX can't remember why we need the *2!
  gl.viewport( 0,0, gl.drawingBufferWidth, gl.drawingBufferHeight )
  //gl.viewport( 0,0, 640, 320 )
  
  makeBuffer()
  makeShaders()
  makeTextures()
  //setInitialState()
  mySetInit()



  var FizzyText = function()
  {
    this.message1 = 'click on anywhere to poke an pixel';

    this.OnOff = false;
    this.f = 0.0457;
    this.k = 0.0635
  };

  var text = new FizzyText();
  var gui = new dat.GUI();
  gui.add(text, 'message1');
  var SimulationEnableController = gui.add(text, 'OnOff');
  SimulationEnableController.onChange(function(value)
  {
  	gl.useProgram( simulationProgram )  
  	if(value)
  	{
    		gl.uniform1i( uIsSimulationOn, 1 )
  	}
  	else
  	{
  		gl.uniform1i( uIsSimulationOn, 0 )
  	}
  });
}

function makeBuffer() 
{
  // create a buffer object to store vertices
  const buffer = gl.createBuffer()

  // point buffer at graphic context's ARRAY_BUFFER
  gl.bindBuffer( gl.ARRAY_BUFFER, buffer )

  const triangles = new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
    -1,  1,
     1, -1,
     1,  1
  ])

  // initialize memory for buffer and populate it. Give
  // open gl hint contents will not change dynamically.
  gl.bufferData( gl.ARRAY_BUFFER, triangles, gl.STATIC_DRAW )
}

function makeShaders() 
{
  // create vertex shader
  let shaderScript = document.getElementById('vertex')
  let shaderSource = glslify(["#define GLSLIFY 1\n    attribute vec2 a_position;\n\n    void main() {\n      gl_Position = vec4( a_position, 0, 1 );\n    }"]) 
  const vertexShader = gl.createShader( gl.VERTEX_SHADER )
  gl.shaderSource( vertexShader, shaderSource )
  gl.compileShader( vertexShader )

  // create fragment shader
  shaderScript = document.getElementById('render')
  shaderSource = glslify(["#ifdef GL_ES\nprecision mediump float;\n#define GLSLIFY 1\n#endif\n\nuniform sampler2D uSampler;\nuniform vec2 resolution;\n\nvoid main() \n{\n  vec4 textureColor = texture2D( uSampler, gl_FragCoord.xy / resolution ).rgba;\n  gl_FragColor = vec4( vec3(textureColor.r), 1. );\n  //gl_FragColor = vec4( textureColor.r, 1. );\n}"])
  const drawFragmentShader = gl.createShader( gl.FRAGMENT_SHADER )
  gl.shaderSource( drawFragmentShader, shaderSource )
  gl.compileShader( drawFragmentShader )
  console.log( gl.getShaderInfoLog(drawFragmentShader) )
  
  // create render program that draws to screen
  drawProgram = gl.createProgram()
  gl.attachShader( drawProgram, vertexShader )
  gl.attachShader( drawProgram, drawFragmentShader )

  gl.linkProgram( drawProgram )
  gl.useProgram( drawProgram )
  
  uRes = gl.getUniformLocation( drawProgram, 'resolution' )
  gl.uniform2f( uRes, gl.drawingBufferWidth, gl.drawingBufferHeight )

  // get position attribute location in shader
  let position = gl.getAttribLocation( drawProgram, 'a_position' )
  // enable the attribute
  gl.enableVertexAttribArray( position )
  // this will point to the vertices in the last bound array buffer.
  // In this example, we only use one array buffer, where we're storing 
  // our vertices
  gl.vertexAttribPointer( position, 2, gl.FLOAT, false, 0,0 )
  
  shaderScript = document.getElementById('simulation')
  shaderSource = glslify(["//r-> on/off; g-> was ant here; \n//only when CONDITION were met, go EXECUTE\n\n//CONDITION: \n//check if neibour.awh is true\n//if so, check that neibour's dir \n//check is target dir is self\n//if so, go EXECUTE\n//else mark AWH = 0 => pixel.g = 0 -> to indecate ant has left\n\n//EXECUTE:\n//if pixel is on, turn right/dir++ by marking the b channel\n//else turn left/dir-- by marking the b channel\n//flip pixel\n\n//game of life simulation fragment shader\n#ifdef GL_ES\nprecision mediump float;\n#define GLSLIFY 1\n#endif\n\nuniform float time;\nuniform vec2 resolution;\n\n// simulation texture state, swapped each frame\nuniform sampler2D state;\nuniform int isSimulationOn;\n//r -> on/off\n//g -> ant was here or not\n//b -> vertical   0->left, 1->right\n//a -> horizontal 0->down 1->up\n\nvec2 antUp = vec2(0,0);\nvec2 antRight = vec2(0,1);\nvec2 antDown = vec2(1,0);\nvec2 antLeft = vec2(1,1);\nvec2 nextAntDir ;\nvec4 outputColor = vec4(0.,0.,-1.,-1.);\n\nvec2 changeDirection(float x, float y, bool sign)//sign true = turn right, false = turn left\n{\n  vec2 temp = vec2(int(x),int(y));\n  if(temp == antUp)\n  {\n    if(sign)\n    {\n      return antRight;\n    }\n    else\n    {\n      return antLeft;\n    }\n  }\n  else if(temp == antRight)\n  {\n    if(sign)\n    {\n      return antDown;\n    }\n    else\n    {\n      return antUp;\n    }\n  }\n  else if(temp == antDown)\n  {\n    if(sign)\n    {\n      return antLeft;\n    }\n    else\n    {\n      return antRight;\n    }\n  }\n  else \n  {\n    if(sign)\n    {\n      return antUp;\n    }\n    else\n    {\n      return antDown;\n    }\n  }\n}\n\n// look up individual cell values \nvec4 myGet(int x, int y) \n{\n  return vec4\n  ( \n    texture2D( state, ( gl_FragCoord.xy + vec2(x, y) ) / resolution ).rgba \n  );\n}\n\nvec4 executeTest(vec4 lastAntVec)\n{\n  int r,g;\n  vec2 dir;\n  g = 1;\n  if(myGet(0,0).r > 0.)  //turn on already\n  {\n    r = 0;   //turn off\n    dir = changeDirection(lastAntVec.b, lastAntVec.a, false);\n  }\n  else\n  {\n    r = 1;  //turn on\n    dir = changeDirection(lastAntVec.b, lastAntVec.a, true);\n  }\n  return vec4 (r,g,dir.x, dir.y);\n}\n\nvoid checkAround()\n{\n  vec4 res;\n  if ( myGet(0,-1).g >0.)   //check down\n  {\n    res = myGet(0,-1);\n    nextAntDir = vec2(int(res.b), int(res.a));\n    if(nextAntDir == antUp)\n    {\n      outputColor = executeTest(res);\n      return;\n    }\n  }\n  else if(myGet(-1,0).g >0.)  //check left\n  {\n    res = myGet(-1,0);\n    nextAntDir = vec2(int(res.b), int(res.a));\n    if(nextAntDir == antRight)   //if next dir == right, execute\n    {\n      outputColor = executeTest(res);\n      return;\n    }    \n  }\n  else if (myGet(1,0).g >0.)   //check right\n  {\n    res = myGet(1,0);  \n    nextAntDir = vec2(int(res.b), int(res.a));\n    if(nextAntDir == antLeft)\n    {\n      outputColor = executeTest(res);\n      return;\n    }\n  }\n  else if(myGet(0,1).g >0.)    //check up\n  {\n    res = myGet(0,1);\n    nextAntDir = vec2(int(res.b), int(res.a));\n    if(nextAntDir == antDown)\n    {\n      outputColor = executeTest(res);\n      return;\n    }\n  }\n  else     //no ant presented in the neibour\n  {\n    return;\n  }\n}\n\nvoid main() \n{\n\tif(isSimulationOn==1)\n\t{\n  \t\tcheckAround();\n  \t\tif(int(outputColor.a) == -1) //output has not been changed -> no ant nearby\n\t\t{\n\t\t    gl_FragColor = vec4(myGet(0,0).r, 0., 0., 0.);\n\t\t}\n\t\telse\n\t\t{\n\t\t    gl_FragColor = outputColor;\n\t\t}\n\t}\n\telse\n\t{\n\t\tgl_FragColor = myGet(0,0);\n\t}  \n}"])
  const simulationFragmentShader = gl.createShader( gl.FRAGMENT_SHADER )
  gl.shaderSource( simulationFragmentShader, shaderSource )
  gl.compileShader( simulationFragmentShader )
  console.log( gl.getShaderInfoLog( simulationFragmentShader ) )
  
  // create simulation program
  simulationProgram = gl.createProgram()
  gl.attachShader( simulationProgram, vertexShader )
  gl.attachShader( simulationProgram, simulationFragmentShader )

  gl.linkProgram( simulationProgram )
  gl.useProgram( simulationProgram )
  
  uRes = gl.getUniformLocation( simulationProgram, 'resolution' )
  gl.uniform2f( uRes, gl.drawingBufferWidth, gl.drawingBufferHeight )
  
  // find a pointer to the uniform "time" in our fragment shader
  uTime = gl.getUniformLocation( simulationProgram, 'time' )
  
  uIsSimulationOn = gl.getUniformLocation( simulationProgram, 'isSimulationOn' )
  gl.uniform1i( uIsSimulationOn, 0 )

  position = gl.getAttribLocation( simulationProgram, 'a_position' )
  gl.enableVertexAttribArray( simulationProgram )
  gl.vertexAttribPointer( position, 2, gl.FLOAT, false, 0,0 )
}

function makeTextures() 
{
  textureBack = gl.createTexture()
  gl.bindTexture( gl.TEXTURE_2D, textureBack )
  
  // these two lines are needed for non-power-of-2 textures
  gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE )
  gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE )
  
  // how to map when texture element is less than one pixel
  // use gl.NEAREST to avoid linear interpolation
  gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST )
  // how to map when texture element is more than one pixel
  gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  
  // specify texture format, see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
  gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, dimensions.width, dimensions.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null )

  textureFront = gl.createTexture()
  gl.bindTexture( gl.TEXTURE_2D, textureFront )
  gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE )
  gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE )
  gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST )
  gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST )
  gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, dimensions.width, dimensions.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null )

  // Create a framebuffer and attach the texture.
  framebuffer = gl.createFramebuffer()
  
  // textures loaded, now ready to render
  render()
}

// keep track of time via incremental frame counter
let time = 0
function render() 
{
  // schedules render to be called the next time the video card requests 
  // a frame of video
  window.requestAnimationFrame( render )
  
  // use our simulation shader
  gl.useProgram( simulationProgram )  
  // update time on CPU and GPU
  time++
  gl.uniform1f( uTime, time )     
  gl.bindFramebuffer( gl.FRAMEBUFFER, framebuffer )
  // use the framebuffer to write to our texFront texture
  gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textureFront, 0 )
  // set viewport to be the size of our state (game of life simulation)
  // here, this represents the size that will be drawn onto our texture
  gl.viewport(0, 0, dimensions.width,dimensions.height )
  
  // in our shaders, read from texBack, which is where we poked to
  gl.activeTexture( gl.TEXTURE0 )
  gl.bindTexture( gl.TEXTURE_2D, textureBack )
  gl.uniform1i( uSimulationState, 0 )
  // run shader
  gl.drawArrays( gl.TRIANGLES, 0, 6 )

  // swap our front and back textures
    let tmp = textureFront
    textureFront = textureBack
    textureBack = tmp
  // use the default framebuffer object by passing null
  gl.bindFramebuffer( gl.FRAMEBUFFER, null )
  // set our viewport to be the size of our canvas
  // so that it will fill it entirely
  gl.viewport(0, 0, dimensions.width,dimensions.height )
  // select the texture we would like to draw to the screen.
  // note that webgl does not allow you to write to / read from the
  // same texture in a single render pass. Because of the swap, we're
  // displaying the state of our simulation ****before**** this render pass (frame)
  gl.bindTexture( gl.TEXTURE_2D, textureFront )
  // use our drawing (copy) shader
  gl.useProgram( drawProgram )
  // put simulation on screen
  gl.drawArrays( gl.TRIANGLES, 0, 6 )
}

function poke( x, y, value, texture ) 
{   
  gl.bindTexture( gl.TEXTURE_2D, texture )
  
  // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texSubImage2D
  gl.texSubImage2D( 
    gl.TEXTURE_2D, 0, 
    // x offset, y offset, width, height
    x, y, 1, 1,
    gl.RGBA, gl.UNSIGNED_BYTE,
    // is supposed to be a typed array
    new Uint8Array([ value, value, value, 255 ])
  )
}

function setInitialState() 
{
  for( i = 0; i < dimensions.width; i++ ) {
    for( j = 0; j < dimensions.height; j++ ) {
      if( Math.random() > .75 ) {
        poke( i, j, 255, textureBack )
      }
    }
  }
}

function mySetInit()
{
  myPoke( dimensions.width/2, dimensions.height/2, 255,1,0,255, textureBack )
}

function myPoke( x, y, r,g,b,a, texture ) 
{   
  gl.bindTexture( gl.TEXTURE_2D, texture )
  
  // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texSubImage2D
  gl.texSubImage2D( 
    gl.TEXTURE_2D, 0, 
    // x offset, y offset, width, height
    x, y, 1, 1,
    gl.RGBA, gl.UNSIGNED_BYTE,
    // is supposed to be a typed array
    new Uint8Array([ r, g, b, a ])
  )
}

function printMousePos(event) 
{
	if(event.clientX > dimensions.width || event.clientY>dimensions.height)
	{
		return;
	}
  console.log("clientX: " + event.clientX + " - clientY: " + event.clientY);

  myPoke( event.clientX, dimensions.height - event.clientY, 255,1,0,255, textureBack )

}

document.addEventListener("click", printMousePos);
},{"glslify":2}],2:[function(require,module,exports){
module.exports = function(strings) {
  if (typeof strings === 'string') strings = [strings]
  var exprs = [].slice.call(arguments,1)
  var parts = []
  for (var i = 0; i < strings.length-1; i++) {
    parts.push(strings[i], exprs[i] || '')
  }
  parts.push(strings[i])
  return parts.join('')
}

},{}]},{},[1]);
