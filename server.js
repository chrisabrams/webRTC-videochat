var connect   = require('connect'),
    express   = require('express'),
    http      = require('http'),
	io        = require('socket.io'),
	mongoose  = require('mongoose'),
    path      = __dirname,
    settings  = require('./config/settings');

//Express
var server    = module.exports = express.createServer();

require('./config/express')(connect, express, path, server, settings);

//Socket.io
require('./lib/sockets')(io, server);

//Routes
require('./lib/router')(express, server, settings);

console.log('Running in ' + (process.env.NODE_ENV || 'development') + ' mode @ ' + settings.uri);