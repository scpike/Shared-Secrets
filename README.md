Shared Secrets
===============

This is a simple node.js application written. It creates anonymous rooms in which
people can enter numbers and see their averages. 

Installation
-------------

1) Install node.js (developed with v 2.5)
    https://github.com/ry/node
2) Clone the repo.
3) Configure host and server at the top of secret_server.js
    Defaults are 192.168.0.134 and port 8124, so change
4) Run with node:
    node <path/to/secret_server.js>

Design Notes
-------------
This is really just an example I'm using to learn node.js. It makes use of
a few modules

1) Socket.io for realtime communication between the clients and the server
2) express node.js web framework
3) node-dirty as a simple key-value store

