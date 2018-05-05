# Node.js-the-right-way practise
## Chapter 3 
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
***Points to note :***
* The ```net.createServer()``` method takes a callback function and returns a ```Server```
object.
* The connection parameter is a ```Socket``` object that can be used to send or receive data.
* Calling ```Server.listen()``` binds the port.

!(Client-TCP-Server)[Client-TCP-Server]

* Node.js binds server to a TCP port.
* Any number of clients can connect to that bound port.

#### Writing Data to a Socket
In the directory called *networking* hold the following code in ```net-watcher.js```

```javascript
'use strict'
const fs = require('fs')
const net = require('net')
const filename = process.argv[2]
if (!filename) {
  throw Error('Error: No filename specified.')
}
net.createServer(connection => {
  // Reporting.
  console.log('Subscriber connected.')
  connection.write(`Now watching "${filename}" for changes...\n`)
  // Watcher setup.
  const watcher = fs.watch(filename, () => connection.write(`File changed: ${new Date()}\n`))
  // Cleanup.
  connection.on('close', () => {
    console.log('Subscriber disconnected.')
    watcher.close()
  })
}).listen(60300, () => console.log('Listening for subscribers...'))
```
***Points to note :***

The callback to ```createServer()``` does three things
* It reports connection establishment (both to the client using ```connection.write``` and to the console)
* Begins listening for changes to target file and the callback to ```watcher``` object sends change information to client using ```connection.write```.
* It listens for the connections's ```close``` event so it can report that the subscriber has disconnected and stop watching the file, with ```watcher.close()```.

The callback passed to ```server.listen()``` is executed after it has been successfully bound to the port.

#### Connecting to TCP Server with Netcat

In the first terminal, we use the watch command to touch the target file at one second intervals
```bash
$ watch -n 1 touch target.txt
```
In a second terminal, run the net-watcher program which creates a service listening on TCP port 60300:
```bash
node net-watcher.js target.txt
Listening for subscribers...
```
To connect to above we use netcat, a socket utility program. Open a third terminal and use the
nc command like so:

```bash
$ nc localhost 60300
Now watching "target.txt" for changes...
File changed: Wed May 02 2018 23:04:14 GMT+0530 (IST)
File changed: Wed May 02 2018 23:04:15 GMT+0530 (IST)
```
Or similar result can be obtained using telnet
```bash
$ telnet localhost 60300
```
Following figure outlines above program :

!(netwatcher)[netwatcher]

More than one subscriber can connect and receive updates simultaneously.

TCP sockets are useful for communicating between networked computers.

#### Listening on Unix Sockets
Open the ```net-watcher.js``` program and change the ```.listen()``` call at the end to this:
```javascript
.listen('/tmp/watcher.sock', () => console.log('Listening for subscribers...'))
```
Save the file as ```net-watcher-unix.js```, then run the program as before :
```bash
$ node net-watcher-unix.js target.txt
Listening for subscribers...
```
To connect a client, we can use ```nc``` as before, but this time specifying the ```-U``` flag to use the socket file.
```bash
 $ nc -U /tmp/watcher.sock
Now watching "target.txt" for changes...
File changed: Wed May 02 2018 23:51:18 GMT+0530 (IST)
File changed: Wed May 02 2018 23:51:19 GMT+0530 (IST)
```

Unix sockets are faster than TCP sockets because they don't require invoking network hardware. However, by nature they are confined to the machine.

### Implementing a Messaging Protocol

A *protocol* is a set of rules that defines how endpoints in a system communicate. 

Here we’ll create a protocol based on passing JSON messages over TCP. JSON is incredibly prevalent in Node.js.

#### Serializing Messages with JSON
Example JSON object with two key-value pairs:
``` json 
{"key":"value", "anotherKey":"anotherValue"}
```
The net-watcher service developed in this chapter sends two kinds of messages :
* When the connection is first established, the client receives the string *Now watching "target.txt" for changes...*
* Whenever the target file changes, the client receives a string like this: *File changed: Fri Dec 18 2015 05:44:00 GMT-0500 (EST)*

The first kind of message is to be encoded this way:
```json
{"type":"watching", "file":"target.txt"}
```
The type field indicates that this is a ```watching``` message—the specified ```file``` is now
being watched.

The second kind of message is encoded this way :
```json
{"type":"changed", "timestamp":1358175733785}
```
Here the ```type``` field announces that the target file has changed.

The ```timestamp``` field contains UNIX time i.e. milliseconds since January 1, 1970.

This protocol will be referred to as Line-Delimited JSON (LDJ).

#### Switching to JSON Messages

In the ```net-watcher.js``` program, find the following line :
```javascript
connection.write(`Now watching "${filename}" for changes...\n`)
```
And replace it with this :
```javascript
connection.write(JSON.stringify({type: 'watching', file: filename}) + '\n')
```
Next, find the call to ```connection.write()``` inside the watcher :
```javascript
const watcher = fs.watch(filename, () => connection.write(`File changed: ${new Date()}\n`))
```
And replace it with this :
```javascript
const watcher = fs.watch(filename, () => connection.write(
JSON.stringify({type: 'changed', timestamp: Date.now()}) + '\n'))
```
Save this updated file as ```net-watcher-json-service.js```. Run the new program.
```javascript
$ node net-watcher-json-service.js target.txt
Listening for subscribers...
```
Then connect using netcat from second terminal :
```bash
$ nc localhost 60300
{"type":"watching","file":"target.txt"}
```
When we ```touch``` the ```target.txt```, we get following output from the client :
```bash
{"type":"changed","timestamp":1525368888725}
```
***Points to note :***
* We used ```JSON.stringify()``` to encode message objects and send them out through ```connection.write()```.
* ```JSON.stringify()``` takes a JavaScript object, and returns a string containing serialized representation of that object in JSON form.

### Creating Socket Client Connections

In the editor insert this code and save as ```net-watcher-json-client.js```
```javascript
const net = require('net')
const client = net.connect({port: 60300})

client.on('data', data => {
  const message = JSON.parse(data)
  if (message.type === 'watching') {
    console.log(`Now watching: ${message.file}`)
  } else if (message.type === 'changed') {
    const date = new Date(message.timestamp)
    console.log(`File changed: ${date}`)
  } else {
    console.log(`Unrecognized message type: ${message.type}`)
  }
})
```
We run this program and ```touch``` the ```target.txt```

To run the program, first make sure the ```net-watcher-json-service``` is running. Then, in another terminal, run the client:
```bash
$ node net-watcher-json-client.js
Now watching: target.txt
```
After we ```touch``` the ```target.txt``` we see a message like this :
```bash
File changed: Sat May 05 2018 23:49:16 GMT+0530 (IST)
```

***Points to note :***
* This short program uses ```net.connect()``` to create a client connection to localhost
port 60300, then waits for data.
* The ```client``` object is a ```Socket```, just like the incoming connection we saw on the server side.
* Whenever a ```data``` event happens, the callback function takes the incoming
buffer object, parses the JSON message, and then logs an appropriate message
to the console.
* This program only listens for ```data``` events, not end events or error events.

### Testing Network Application Functionality