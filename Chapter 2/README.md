# Node.js-the-right-way practise
## Chapter 2 
## Wrangling the File System

### Chapter objectives :
* #### Node.js Core
  Using Node.js’s module system to bring in core libraries.
* #### Patterns
  Use common Node.js patterns like callbacks for handling asynchronous events, harness Node.js’s EventEmitter and Stream classes to pipe data around.
* #### JavaScriptisms
  JavaScript features and best practices like block scoping and arrow function expressions.
* #### Supporting Code
  Learn how to spawn and interact with child processes, capture their output, and detect state changes.

### Programming for the Node.js Event Loop

#### Watching a File for Changes

Create a text file

``` Unix
$ touch target.txt

$ echo, > target.txt
```

Enter following code and save this file as *watcher.js* alongside the target.txt file.

```Javascript
'use strict'

const fs = require('fs')

fs.watch('target.txt', () => console.log('file changed!'))

console.log('Now watching target.txt for changes...')
```
***Points to note :***
* A variable declared with ```const``` must be assigned a value when
declared, and cannot be assigned to again (which would cause a runtime
error).

* The ```require()``` function pulls in a Node.js module and returns it.

* The fs module’s ```watch()``` method, takes a path to a file and a callback function to invoke whenever the file changes.

    In JavaScript, functions are first-class citizens meaning they can be assigned to variables and passed as parameters to other functions.

* The callback :

    ```() => console.log('File changed!')```
    
    This is an arrow function expression. Arrow functions have a big advantage over their ancestral counterparts as they do not create a new scope for ```this```.

Run the following command in terminal
``` Unix
$ Node watcher.js
Now watching target.txt for changes...
```
Use the ```watch``` command to detect changes using ```touch``` on target file.
``` Unix
$ watch -n 1 touch target.txt
```
This command will touch the target file once every second until you stop it.
#### Visualizing the Event Loop

The File-watcher program written previously causes Node.js to go
through each of these steps, one by one :

* The script ```watcher.js``` loads, running all the way through to the last line, which produces the *Now watching* message in the console.
* It sees that there’s more to do, because of the call to ```fs.watch()```.
* It waits for something to happen, namely for the ```fs``` module to observe a change to the file.
* It executes callback function when any change is detected.
* It determines that the program still has not finished, and resumes waiting.
#### Reading Command-Line Arguments
Create ```watcher-argv.js``` and enter this :
```Javascript
const fs = require('fs')

const filename = process.argv[2]

if (!filename) {
  throw Error('A file to watch must be specified!')
}

fs.watch(filename, () => console.log(`File ${filename} changed!`))

console.log(`Now watching ${filename} for changes...`)
```
Run the program:
``` Unix
$ node watcher-argv.js target.txt
```
***Points to note :***

* We used ```process.argv``` to access the incoming command-line arguments.
```argv``` stands for argument vector; it’s an array containing node and the full path
to the ```watcher-argv.js``` as its first two elements. The third element (that is, at
index 2) is target.txt, the name of our target file. 
* Backtick characters (‘) are called *template strings*. They can span multiple lines and support expression extrapolation i.e. expression inside ```${}``` and it will insert stringified result.
* If a target file name is not provided to watcher-argv.js, the program will throw
an exception.

    ``` Unix
    $ node watcher-argv.js
    /home/abhishek/Desktop/Node.js-the-right-way/Chapter 2/watcher-argv.js:6
        throw Error('A file to watch must be specified!');
        ^
    Error: A file to watch must be specified!
    ```
    Any unhandled exception thrown in Node.js will halt the process.

### Spawning a Child Process
In the editor, enter following code and save the file as ```watcher-spawn.js``` and run it :
``` Javascript
'use strict'

const fs = require('fs')
const spawn = require('child_process').spawn
const filename = process.argv[2]

if (!filename) {
  throw Error(' A file to watch must be specified!')
}

fs.watch(filename, () => {
  const ls = spawn('ls', ['-l', '-h', filename])
  ls.stdout.pipe(process.stdout)
})

console.log(`Now watching ${filename} for changes...`)
```
If we touch the target file, the Node.js program will produce something like this:

```Unix
-rw-rw-r-- 1 abhishek abhishek 11 Apr 30 04:11 target.txt
```
The username, group, and other properties of the file will be different, but
the format should be the same.

***Points to note :***
* Calling
    ```require('child_process')``` returns the child process module. We’re only interested in the ```spawn()``` method, so we save that and ignore rest of the module.
    ```Javascript
    const spawn = require('child_process').spawn
    ```
* The callback function we passed to ```fs.watch()``` 
  ```Javascript
  () => {
      const ls = spawn('ls', ['-l', '-h', filename])
      ls.stdout.pipe(process.stdout)
  }
  ```
  The first parameter to ```spawn()``` is the name of the program we wish to execute; here it’s ```ls```. The second parameter is an array of command-line arguments. It contains the flags and the target file name.
* The object returned by ```spawn()``` is a ```ChildProcess```. Its ```stdin```, ```stdout```, and ```stderr``` properties are ```Streams``` that can be used to read or write data. We want to send the standard output from the child process directly to our own standard output stream.
This is what the ```pipe()``` method does.

### Capturing Data from an EventEmitter
*EventEmitter is a very important class in Node.js.*

In this section we replace the ```fs.watch()``` with following code and save it as ```watcher-spawn-parse.js```

``` Javascript
fs.watch(filename, () => {
  const ls = spawn('ls', ['-l', '-h', filename])
  let output = ''
  ls.stdout.on('data', chunk => output += chunk)
  ls.on('close', () => {
    const parts = output.split(/\s+/)
    console.log([parts[0], parts[4], parts[8]])
  })
})
```
After running the program and using ```touch``` we should see soemthing like this :
```Unix
$ node watcher-spawn-parse.js target.txt
Now watching target.txt for changes...
[ '-rw-rw-r--', '11', 'target.txt' ]
```
***Points to note :***
* The new callback does the same as before creating child process and assigns it to ```ls```
* The ```output``` variable buffers the output coming from the child process.
* Next we added an *event listener*. An event listener is a callback function that is invoked when an event of specified type is dispatched.
* The Stream class
inherits from EventEmitter, so we can listen for events from the child process’s standard output stream.

  ```Javascript
  ls.stdout.on('data', chunk => output += chunk)
  ```
  The ```on()``` method adds a listener for the specified event type. Here we are listening for data events  coming out of the stream.

  Events can send along extra information, which arrives in the form of parameters to the callbacks. Data events in particular pass along a ```Buffer``` object. Each time we get a chunk of data, we append it to our output.

* A *Buffer* is Node.js’s way of representing binary data. It points to a blob of memory allocated by Node.js’s native core, outside of the JavaScript engine.

* Any time you add a non-string to a string in JavaScript (like we’re doing here
with ```chunk```), the runtime will implicitly call the object’s ```toString()``` method.

* Like Stream, the ChildProcess class extends EventEmitter, so we can add listeners to it, as well.
  ```Javascript
    ls.on('close', () => {
      const parts = output.split(/\s+/)
      console.log([parts[0], parts[4], parts[8]])
    })
  ```
  After a child process has exited and all its streams have been flushed, it emits a close event.
  
  When the callback in above snippet is invoked, we parse the output
  data by splitting at whitespace characters (using
  the regex ```/\s+/```). 

  Finally, the first, fifth, and ninth fields (indexes 0, 4, and 8) logged above, correspond to the permissions, size, and file name, respectively.

### Reading and Writing Files Asynchronously

An example of the whole-file-at-once
approach:
```Javascript
'use strict'
const fs = require('fs')

fs.readFile('target.txt', (err, data) => {
  if (err) {
    throw err
  }
  console.log(data.toString())
}
```
Save this as ```read-simple.js``` and run.
```Unix
$ node read-simple.js
```
The contents of ```target.txt``` will be printed in the command line.

***Points to note :*** 
* The first parameter to the ```readFile()``` callback handler is ```err``` which is null if readFile is successful, otherwise it will contain an ```Error``` object.
* Above we ```throw``` if there is one. An uncaught exception in Node.js will halt the program by escaping the event loop.

Writing a file using the whole-file approach is similar :

```Javascript
'use strict'

const fs = require('fs')
fs.writeFile('target.txt', 'hello world' , (err) => {
  return (err) || console.log('File Saved!')
})
```
The above program is saved in ```write-simple.js```

***Points to note :***
* This program writes ```hello world``` to ```target.txt``` (creating it if it doesn’t exist, or overwriting it if it does). 

* If for any reason the file couldn’t be written, then the ```err``` parameter will contain an Error object.

#### Creating Read and Write Streams

Read or write stream can be created by using ```fs.createReadStream()``` and
```fs.createWriteStream()```, respectively. 

Here’s a very short program
called ```cat.js```. It uses a file stream to pipe a file’s data to standard output:
```Javascript
#!/usr/bin/env node
'use strict'

require('fs').createReadStream(process.argv[2]).pipe(process.stdout)
```
***Points to note :***
* As the first line starts with ```#!```, this program can be directly executed without passing into ```node```.

* Make it executable using ```chmod```
``` Unix
$ chmod +x cat.js
```
* Pass filenames like this
```Unix
$ ./cat.js target.txt
Let there be light
```
* Here we have not assigned ```fs``` to a variable. We called methods on ```require()``` directly.

Listen for ```data``` events instead of calling ```pipe()```

```Javascript
'use strict'

require('fs').createReadStream(process.argv[2])
.on('data', chunk => process.stdout.write(chunk))
.on('error', err => process.stderr.write(`ERROR: ${err.message}\n`));
```
***Points to note :***
* Here we use ```process.stdout.write()``` to instead of ```console.log()```
* When working with an EventEmitter, the way to handle errors is to listen for
error events.
* On triggering the error (by specifying a file to read that doesn't exist) we get
```Unix
Error: ENOENT: no such file or directory, open 'targe.txt'
```

#### Blocking the Event Loop with Synchronous File Access

* The methods discussed so far have been asynchronous. They perform their I/O duties—waiting as necessary—completely
in the background, only to invoke callbacks later.

* The ```fs``` module have synchronous versions as well. These end in **Sync*, like ```readFileSync```

* When using *Sync methods, the Node.js process will block until the
I/O finishes. Node.js won’t execute any other code, won’t trigger any callbacks, won’t process any events, won’t accept any connections—nothing. It’ll just sit there indefinitely waiting for the operation to complete.

* An example of how to read a file using the readFileSync() method:
  ``` Javascript
  const fs = require('fs')
  const data = fs.readFileSync('target.txt')
  process.stdout.write(data.toString())
  ```
  The return value of readFileSync() is a buffer.

### The Two Phases of a Node.js Program
If your program couldn’t possibly succeed without the
file, then it’s OK to use synchronous file access. If your program could conceivably continue about its business, then it’s better to take the safe route
and stick to asynchronous I/O.

The ```require()``` function is an example of this principle in action.


