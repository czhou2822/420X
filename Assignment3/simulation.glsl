//r-> on/off; g-> was ant here; 
//only when CONDITION were met, go EXECUTE

//CONDITION: 
//check if neibour.awh is true
//if so, check that neibour's dir 
//check is target dir is self
//if so, go EXECUTE
//else mark AWH = 0 => pixel.g = 0 -> to indecate ant has left

//EXECUTE:
//if pixel is on, turn right/dir++ by marking the b channel
//else turn left/dir-- by marking the b channel
//flip pixel

//game of life simulation fragment shader
#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

// simulation texture state, swapped each frame
uniform sampler2D state;
uniform int isSimulationOn;
//r -> on/off
//g -> ant was here or not
//b -> vertical   0->left, 1->right
//a -> horizontal 0->down 1->up

vec2 antUp = vec2(0,0);
vec2 antRight = vec2(0,1);
vec2 antDown = vec2(1,0);
vec2 antLeft = vec2(1,1);
vec2 nextAntDir ;
vec4 outputColor = vec4(0.,0.,-1.,-1.);


vec2 changeDirection(float x, float y, bool sign)//sign true = turn right, false = turn left
{
  vec2 temp = vec2(int(x),int(y));
  if(temp == antUp)
  {
    if(sign)
    {
      return antRight;
    }
    else
    {
      return antLeft;
    }
  }
  else if(temp == antRight)
  {
    if(sign)
    {
      return antDown;
    }
    else
    {
      return antUp;
    }
  }
  else if(temp == antDown)
  {
    if(sign)
    {
      return antLeft;
    }
    else
    {
      return antRight;
    }
  }
  else 
  {
    if(sign)
    {
      return antUp;
    }
    else
    {
      return antDown;
    }
  }
}

// look up individual cell values 
vec4 myGet(int x, int y) 
{
  return vec4
  ( 
    texture2D( state, ( gl_FragCoord.xy + vec2(x, y) ) / resolution ).rgba 
  );
}


vec4 executeTest(vec4 lastAntVec)
{
  int r,g;
  vec2 dir;
  g = 1;
  if(myGet(0,0).r > 0.)  //turn on already
  {
    r = 0;   //turn off
    dir = changeDirection(lastAntVec.b, lastAntVec.a, false);
  }
  else
  {
    r = 1;  //turn on
    dir = changeDirection(lastAntVec.b, lastAntVec.a, true);
  }
  return vec4 (r,g,dir.x, dir.y);
}


void checkAround()
{
  vec4 res;
  if ( myGet(0,-1).g >0.)   //check down
  {
    res = myGet(0,-1);
    nextAntDir = vec2(int(res.b), int(res.a));
    if(nextAntDir == antUp)
    {
      outputColor = executeTest(res);
      return;
    }
  }
  else if(myGet(-1,0).g >0.)  //check left
  {
    res = myGet(-1,0);
    nextAntDir = vec2(int(res.b), int(res.a));
    if(nextAntDir == antRight)   //if next dir == right, execute
    {
      outputColor = executeTest(res);
      return;
    }    
  }
  else if (myGet(1,0).g >0.)   //check right
  {
    res = myGet(1,0);  
    nextAntDir = vec2(int(res.b), int(res.a));
    if(nextAntDir == antLeft)
    {
      outputColor = executeTest(res);
      return;
    }
  }
  else if(myGet(0,1).g >0.)    //check up
  {
    res = myGet(0,1);
    nextAntDir = vec2(int(res.b), int(res.a));
    if(nextAntDir == antDown)
    {
      outputColor = executeTest(res);
      return;
    }
  }
  else     //no ant presented in the neibour
  {
    return;
  }
}



void main() 
{
	if(isSimulationOn==1)
	{
  		checkAround();
  		if(int(outputColor.a) == -1) //output has not been changed -> no ant nearby
		{
		    gl_FragColor = vec4(myGet(0,0).r, 0., 0., 0.);
		}
		else
		{
		    gl_FragColor = outputColor;
		}
	}
	else
	{
		gl_FragColor = myGet(0,0);
	}  
}