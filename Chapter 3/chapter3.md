# Node.js-the-right-way practise
## Chapter 2 
## Networking with Sockets

### Chapter objectives :
* #### Node.js Core
  Learn how to extend ```Eventemitter``` class and create custom modules to house reusable code.
* #### Patterns
  A network connection has two endpoints. A common pattern is for one endpoint to act as the server while the other is the client. We’ll develop both kinds of endpoints in this chapter, as well as a JSON-based protocol for client/server.
* #### JavaScriptisms
  Familiarize with JavaScript inheritance model and learn about Node.js’s utilities for creating class hierarchies.
* #### Supporting Code
  Testing our programs with Mocha.

  Develop a simple and complete TCP server program.

### Listening for Socket Connections
Networked services exist to do two things: connect endpoints and transmit
information between them. But a connection must first be made.

#### Binding a Server to a TCP Port
TCP socket connections consist of two endpoints. One endpoint binds to a
numbered port while the other endpoint connects to a port.

In Node.js, the bind and connect operations are provided by the ```net``` module.
Binding a TCP port to listen for connections looks like this:
```Javascript
const net = require('net'),
server = net.createServer(connection => { // use the connection object for data transfer
})
server.listen(60300)
```
