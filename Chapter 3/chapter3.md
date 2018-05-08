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
* ```JSON.stringify()``` encodes the message objects and sends them out through ```connection.write()```.
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
* This program uses ```net.connect()``` to create a client connection to localhost
port 60300, then waits for data.
* The ```client``` object is a ```Socket```, just like the incoming connection we saw on the server side.
* Whenever a ```data``` event happens, the callback function takes the incoming
buffer object, parses the JSON message, and then logs an appropriate message
to the console.
* This program only listens for ```data``` events, not end events or error events.

Basically we improved upon netcat in this section.

### Testing Network Application Functionality
Functional tests assure us that our code does what we expect it to do. In this
section, we’ll develop a test for our networked file-watching server and client
programs. But first we need to
understand a problem lurking in our client/server programs as currently
written.

#### Understanding the Message-Boundary Problem
Network programs developed in Node.js often communicate using messages and in the best case, a message will arrive at once. But sometimes message will arrive in pieces, split into distinct ```data``` events.

The LDJ protocol we developed separates messages with newline which is the *boundary* between two messages. Eg.
```json
{"type":"watching", "file":"target.txt"}\n
{"type":"changed", "timestamp":1358175733785}\n
{"type":"changed", "timestamp":1358175734785}\n
```
Each line of out is a single ```data``` event. Or, we can say that the data event boundary matches up with message boundaries.

But consider what would happen if a message were split down the middle,
and arrived as two separate data events. Such a split could happen in the wild,
especially for large messages. 

![message split image](image.png)

Let's create a service that splits such message.

#### Implementing a Test Service
Open your editor and enter this :
```javascript
const server = require('net').createServer(connection => {
  console.log('Subscriber Connected')

  // Two messages chunks that together make a whole message.
  const firstChunk = '{"type": "changed", "timesta'
  const secondChunk = 'mp": 1525549135}\n'

  // Send the first chunk immediately
  connection.write(firstChunk)

  // After a short delay, send the other chunk
  const timer = setTimeout(() => {
    connection.write(secondChunk)
    connection.end()
  }, 100)

  connection.on('end', () => {
    clearTimeout(timer)
    console.log('Subscriber disconnected.')
  })
})

server.listen(60300, () => {
  console.log('Test server looking for subscribers...')
})
```
Save this file as ```test-json-service.js``` and run it.
```bash
$ node test-json-service.js
Test server looking for subscribers...
```
***Points to note :***
* There is no file watcher. Instead we just send the predetermined chucks.
* The ```setTimeout()``` takes two parameters: a function and an amount of time in milliseconds after which the function is invoked. It sends the second chunk after a short delay (100ms in this example).
* Whenever the connection ends, ```clearTimeout()``` is used to unschedule the callback. This is necessary because once a connection
is closed, any calls to ```connection.write()``` will trigger error events.


* Let us run it and see what happens :
  ```bash
  $ node net-watcher-json-client.js
  SyntaxError: Unexpected end of JSON input
      at JSON.parse (<anonymous>)
  ``` 
* The error message tells us that the message was not complete and valid JSON. Our client attempted to send half a message to ```JSON.parse()```, which expects only whole, properly formatted JSON strings as input.

We fix the client in subsequent sections to work with it.

### Extending Core Classes in Custom Modules
In previous program any message that arrives as multiple data events will crash it.
To correct this the client program has to do two things :
* Buffer incoming data into messages.
* Handle each message when it arrives.

For this, the right thing to do is to turn at least one of them into a Node.js module.

#### Extending EventEmitter
To relieve the client program from the danger of split JSON messages, we’ll implement an LDJ buffering client module.

##### Inheritance in Node
First let’s have a look at how Node.js does inheritance. The following code
sets up LDJClient to inherit from EventEmitter. Save it as ```ldj-client.js```.
```javascript
const EventEmitter = require('events').EventEmitter;

class LDJClient extends EventEmitter {
  constructior (stream){
    super()
  }
}
```
***Points to note :***
* ```LDJClient``` is a *class*, which means other code should call ```new LDJClient(stream)``` to
get an instance.
* The ```stream``` parameter is an object that emits ```data``` events, such as a ```Socket``` connection.
* Inside the constructor function, we first call ```super()``` to invoke ```EventEmitter```’s own constructor function.  Under the hood, JavaScript uses *prototypal inheritance* to establish the relationship between ```LDJClient``` and ```EventEmitter```.
___
###### Prototypal Inheritance in Javascript
When we make an ```LDJClient``` instance call ```client``` and ```client.on()```. Even though
the client object itself and the ```LDJClient``` prototype both lack an ```on``` method, the JavasScript engine will find and use the on method of ```EventEmitter```.

In the same fashion, if we call ```client.toString()```, the JavaScript engine will find and use
the native implementation on the ```EventEmitter```’s prototypal parent, ```Object```.
___

Code to use LDJClient might look like this:
```javascript
const client = new LDJClient(networkStream)
client.on('message', message => {
// Take action for this message.
})
```
The class heirarchy is in place. Let's implement something to emit ```message``` events.

#### Buffering Data Events
The goal is to take the incoming raw data from the stream and convert it into message events containing the parsed message objects.

Take a look at the following code added to ```ldj-client.js```.
```javascript
constructor(stream) {
  super()
  let buffer = ''
  stream.on('data', data => {
    buffer += data
    let boundary = buffer.indexOf('\n')
    while (boundary !== -1) {
      const input = buffer.substring(0, boundary)
      buffer = buffer.substring(boundary + 1)
      this.emit('message', JSON.parse(input))
      boundary = buffer.indexOf('\n')
    }
  })
}
```
***Points to note :***
* We call ```super``` and then set up a string variable called ```buffer``` to capture incoming data.
* We use ```stream.on``` to handle data events.
* We append raw data to the end of ```buffer``` and then look for completed messages from the front.
* Each message string is sent through ```JSON.parse()``` and finally emitted
by the ```LDJClient``` as a ```message``` event via ```this.emit()```.

 Here the problem we started with (handling split messages) is effectively solved. 

#### Exporting Functionality in a Module
We export ```LDJClient``` as a module by first creating a directory called ```lib```. There is a strong convention in *Node.js* community to put supporting code in the lib directory.

In the text editor we enter the following :
```javascript
const EventEmitter = require('evernts').EventEmitter
class LDJSClient extends EventEmitter {
  constructor (stream)  {
    super()
    let buffer = ''
    stream.on('data', data => {
      buffer += data
      let boundary = buffer.indexOf('\n')
      while (boundary != -1){
        const input = buffer.substring(0, boundary)
        buffer = buffer.substring(boundary + 1)
        this.emit('message', JSON.parse(input))
        boundary = buffer.indexOf('\n')
      }
    })
    static connect(stream) {
      return new LDJClient (stream)
    }
  }
}
module.exports = LDJClient
```
Save the file as ```lib/ldj-client.js```

***Points to note :***
* Here we are adding a static method called ```connect()```. It is attached to ```LDJClient``` class itself.
* The ```connect()``` method is merely convenience for users of the library so they don't have to use the ```new``` operator to create an instance  of ```LDJClient```.
* The ```module.exports``` object is the bridge between the code and outside world. Properties set on ```exports``` will be available to upstream code that pulls in the module.

#### Importing a Custom Node.js Module
Code to use the LDJ module will look something like this:
```javascript
const LDJClient = require('./lib/ldj-client.js')
const client = new LDJClient(networkStream)
```
Or, using the ```connect()``` method, it could look like this :
```javascript
const client = require('./lib/ldj-client.js').connect(networkStream)
```
***Points to note :***
* ```require()``` function takes an actual path here unlike the shorthadn previously seen with ```fs``` and ```net```.
* When a path is provided to ```require()```, Node.js will attempt to resolve the path relative to the current file.

#### Modifying the Client
Enter the following in the text editor :
```Javascript
const netClient = require('net').connect({60300})
const ldjClient = require('./lib/ldj-client.js').connect(netClient)

ldjClient.on('message', message => {
  if (message.type === 'watching') {
    console.log(`Now watching: ${message.file}`)
  } else if (message.type === 'changed'){
    console.log(`File changed: ${new Date(message.timestamp)}`)
  } else {
    throw Error(`Unrecognized message type: ${message.type}`)
  }
})
```
Save this as ```net-watcher-ldj-client.js``` and run.
```bash
$ node test-json-service.js
Test server looking for subscribers...
```
In a different terminal, use the new client to connect to it:
```bash
$ node net-watcher-ldj-client.js
File changed: Sun Jan 18 1970 21:15:49 GMT+0530 (IST)
```
We now have a server and client that use a custom message format to reliably communicate.

### Developing Unit Tests with Mocha
Mocha is a popular, multi-paradigm testing framework for Node.js. It features several different styles for describing your tests. We’ll be using the BehaviorDriven Design (BDD) style.

#### Installing Mocha With ```npm```
```npm``` relies on a configuration file called package.json, so let’s create one now.
Open a terminal to your networking project and run this :

```bash
$ npm init -y
```
Calling ```npm init``` will create a default package.json file.

Next we install Mocha by running ```npm install```
```bash
npm install --save-dev --save-exact mocha@3.4.2
npm notice created a lockfile as package-lock.json. You should commit this file.
npm WARN networking@1.0.0 No description
npm WARN networking@1.0.0 No repository field.

+ mocha@3.4.2
added 34 packages from 290 contributors in 10.233s
```
***Points to note :***

* We can safely ignore the warnings in the output for now. npm is just suggesting that you add some descriptive fields to your package.json.
* We now have a folder called ```node_modules``` in our project which contains Mocha and its dependencies.
* In ```package.json``` we find this field :
  ```json
  "devDependencies": {
    "mocha": "3.4.2"
  }
  ```
  In Node.js, there are a few different kinds of dependencies. Regular dependencies are used at run time by your code when you use ```require()``` to bring in
  modules. Dev dependencies are programs that your project needs during
  development. Mocha is the latter kind, and the ```--save-dev``` flag (```-D``` for short) told
  npm to add it to the ```devDependencies``` list.
* Both dev dependencies and regular runtime dependencies are installed when you run ```npm install``` with no additional arguments.
* For running only regular runtime dependencies and not dev dependencies we use ```npm install``` with ```--production``` flag or setting ```NODE_ENV``` to *production*.

#### Semantic Versioning of Packages



