module.exports = function Server(io, server) {
	var socket = io.listen(server);

	socket.on('connection', function(socket) {

		console.log('Client Connected');
		socket.broadcast.emit('connected', {});

		socket.on('message', function(data) {
			socket.broadcast.emit('server_message', data);
			socket.emit('server_message', data);
		});

		socket.on('disconnect', function() {
			console.log('Client Disconnected.');
		});
	});

	return this;
};