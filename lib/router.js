module.exports = function(express, server, settings) {

    //Show all errors and keep search engines from using robots.txt
    server.configure('development', function() {
        server.use(express.errorHandler({
            'dumpExceptions': true,
            'showStack': true
        }));
        server.all('/robots.txt', function(req,res) {
            res.send('User-agent: *\nDisallow: /', {'Content-Type': 'text/plain'});
        });
    });

    //Suppress errors, allow all search engines
    server.configure('production', function() {
        server.use(express.errorHandler());
            server.all('/robots.txt', function(req,res) {
            res.send('User-agent: *', {'Content-Type': 'text/plain'});
        });
    });

    server.get('/', function(req, res) {
        res.render(settings.themes[settings.theme].index, {
            title: 'Index'
        });
    });

    //404
    server.get('*', function(req, res) {
        if(req.accepts('html')) {
            res.status(404);
            res.render(settings.themes[settings.theme].errors.notfound, {
                title: 'Not Found'
            });
        }
    });
}
