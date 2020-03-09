const udp = require('dgram');
const osc = require('osc-min')

const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 10080 });

var clients = []

wss.on('connection', function connection(ws) 
{
  console.log( 'received connection.' )
  clients = []
  clients.push( ws )
  ws.on('message', function incoming(message) 
  {
    console.log('received: %s', message);
  });

});





const sock = udp.createSocket("udp4", function(msg, rinfo) 
{
  try 
  {
    const _msg = osc.fromBuffer( msg )
    clients.forEach( c => c.send( JSON.stringify(_msg) ))
    return console.log( osc.fromBuffer( msg ) )
  } 
  catch (error) 
  {
    return console.log( "invalid OSC packet", error )
  }
})



sock.bind(8000)