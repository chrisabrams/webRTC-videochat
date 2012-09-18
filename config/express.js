module.exports = function(connect, express, path, server, settings) {

	server.configure(function() {
		server.set('views', path + '/views');
		server.set('view engine', 'jade');
		server.set('view options', { layout: false });
		server.use(connect.bodyParser());
		server.use(connect.static(path + '/public'));
		server.use(express.cookieParser());
		server.use(express.session({secret: settings.sessionSecret}));
		server.use(server.router);
	});

	server.listen(settings.port, null);
};