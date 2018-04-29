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

Enter following code

```Javascript
'use strict'

const fs = require('fs')

fs.watch('target.txt', ()=> console.log('file changed!'));

console.log('Now watching target.txt for changes...')
```


Save this file as *watcher.js* alongside the target.txt file.

***Points to note :***
* A variable declared with ```const``` must be assigned a value when
declared, and cannot be assigned to again (which would cause a runtime
error).

* The require() function pulls in a Node.js module and returns it.

* The fs module’s ```watch()``` method, takes a path to a file and a callback function to invoke whenever the file changes.

    In JavaScript, functions are first-class citizens meaning they can be assigned to variables and passed as parameters to other functions.

* The callback :

    ```() => console.log('File changed!')```
    
    This is an arrow function expression. Arrow functions have a big advantage over their ancestral counterparts as they do not create a new scope for ```this```.

Run following in terminal
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

The File-watcher program written in previous step causes Node.js to go
through each of these steps, one by one :

* The script ```watcher.js``` loads, running all the way through to the last line, which produces the *Now watching* message in the console.
* It sees that there’s more to do, because of the call to ```fs.watch()```.
* It waits for something to happen, namely for the ```fs``` module to observe a change to the file.
* It executes callback function when any change is detected.
* It determines that the program still has not finished, and resumes waiting.
#### Reading Command-Line Arguments

Create ```watcher-argv.js``` and enter this :

```Javascript
const fs = require('fs');

const filename = process.argv[2];

if (!filename){
	throw Error('A file to watch must be specified!');
}

fs.watch(filename, () => console.log(`File ${filename} changed!`));

console.log(`Now watching ${filename} for changes...`);
```
Run the file:
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
Open the editor, enter following code. Save file as ```watcher-spawn.js``` and run it :
``` Javascript
'use strict'

const fs = require('fs');
const spawn = require('child_process').spawn
const filename = process.argv[2]

if (!filename){
	throw Error(' A file to watch must be specified!')
}

fs.watch(filename, () => {
	const ls = spawn('ls', ['-l', '-h', filename]);
	ls.stdout.pipe(process.stdout)
});

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
    const ls = spawn('ls', ['-l', '-h', filename]);
    ls.stdout.pipe(process.stdout);
    }
    ```
    The first parameter to ```spawn()``` is the name of the program we wish to execute; here it’s ```ls```. The second parameter is an array of command-line arguments. It contains the flags and the target file name.
* The object returned by ```spawn()``` is a ```ChildProcess```. Its ```stdin```, ```stdout```, and ```stderr``` properties are ```Streams``` that can be used to read or write data. We want to send the standard output from the child process directly to our own standard output stream.
This is what the ```pipe()``` method does.

### Capturing Data from an EventEmitter
*EventEmitter is a very important class in Node.js.*

