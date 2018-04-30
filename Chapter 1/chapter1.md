# Node.js-the-right-way practise

## Chapter 1
## Getting Started
***

*"The best line of code is the one you never had to write."*

### Thinking Beyond the Web

Imagine the set of all possible programs as the inhabitants of a vast sea.
Programs that have similar purposes are near to each other, and programs that differ are further apart. With that picture in mind, take a look at this
map. It shows a close-up of one particular outcrop in this sea, the Island of
I/O-Bound Programs.

![The Island of IO-Bound Programs]( https://raw.githubusercontent.com/Abhicoding/Node.js-the-right-way/master/Chapter%201/the%20Island%20of%0D%20IO-Bound%20Programs.png )

I/O-bound programs are constrained by data access. These are programs
where adding more processing power or RAM often makes little difference.

East of the mountain range, we find the client-side programs. These include
GUI tools of all stripes, consumer applications, mobile apps, and web apps.
Client-side programs interact directly with human beings, often by waiting
patiently for their input.

Deep within the server-side region lies the Web—that old guard of HTTP, Ajax,
REST, and JSON. The websites, apps, and APIs that consume so much of
our collective mental energy live here.

### How Node.js Applications Work

* Node.js couples JavaScript with an event loop for quickly dispatching operations when events occur.

![Event Loop](https://raw.githubusercontent.com/Abhicoding/Node.js-the-right-way/master/Chapter%201/event-loop.png)

* Everything else your program might do—like waiting for data from a file or
an incoming HTTP request—is handled by Node.js, in parallel, behind the
scenes. Your application code will never be executed at the same time as
anything else.

#### Single-Threaded and Highly Parallel

* Node.js is a single-threaded environment i.e. at
most, only one line of your code will ever be executing at any time.

* Node.js gets away with this by doing most I/O tasks using nonblocking
techniques. Rather than waiting line-by-line for an operation to finish, you
create a callback function that will be invoked when the operation eventually
succeeds or fails.
