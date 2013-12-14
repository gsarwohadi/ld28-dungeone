var _ = require("underscore");
var express = require("express");
var http = require("http");
var swig = require("swig");
var app = express();

var routes = require("./routes");

app.configure(function ()
{
	app.engine(".html", swig.renderFile);
	app.set("view engine", "html");
	app.set("views", __dirname + "/views");
	app.use(express.logger({ format: ":method :url" }));
	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(__dirname + "/public"));
	
	routes(app);
	
	var port = 2828;
	http.createServer(app).listen(port, function ()
	{
		console.log("[OK] DungeONE server on %s", port);
	});
})