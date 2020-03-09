 Assignment 3
The purpose of this project is to explore Langton’s ant in the GLSL environment without the need of computation on the CPU side. Unfortunately, due to the time constraint, I cannot incorporate color into the project, nor it suggests any themes. But rather a vanilla simulation with extra interactive features.  
Implementation:
In other to implement the simulation, I choose to use 4 channels within each pixel to store the info I need for the program. 
•	R-> ON/OFF
•	G->Was ant here last frame
•	B, A -> these two channels combines to indicate the ant’s direction on next frame. 
o	00->up, 01->right, 10->down, 11->left
Program flow:
1.	For each pixel, it checks its neighbors’ G channel.
a.	If g channel is one, that suggest the ant was here last frame, proceed to step 2.
b.	If not, that suggests the ant was not here last frame. Proceed to 1c
c.	The pixel should maintain on/off status and clear ant and directional flags. 
2.	If the ant flag is presented, check that pixel’s direction
a.	If this pixel is the desired direction to the it’s checked neighbor, proceed to step 3
b.	If not, proceed to 1c.
3.	Mark the ant flag and check the current state of this pixel
a.	If this pixel is on, mark the directional flag one step forward (00->01, 11->00)
b.	If the pixel is off, mark the directional flag on step backward (00->11, 11->10)
4.	Flip the pixel and output color.

Interaction:
1.	At any time, the simulation can be paused and resume.  
2.	User can poke at the canvas and “spawn” a new ant. 

Feedback:
People generally like the idea of poke a new ant. The original purpose of this feature is to allow use to design their own starting state. To my surprise, almost all user poke while the simulation is running. And some consider this as a move to “save” the dead zone. 
