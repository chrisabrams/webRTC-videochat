var settings = {
	sessionSecret: 'sh44FSFEIPANVPOEANVh5h55h66h7h7x01hhh!',
	port: 8081,
	debug: (process.env.NODE_ENV !== 'production'),
	theme: 'default',
	themes: {
		default: {
			errors: {
				notfound: 'themes/default/errors/404'
			},
			layout: 'themes/default/layout',
			index: 'themes/default/index'
		}
	}
};

settings.uri = 'http://localhost:' + 8081;

if (process.env.NODE_ENV == 'production') {
	settings.uri = 'http://videochat.jit.su';
	settings.port = process.env.PORT || 80;
}

module.exports = settings;