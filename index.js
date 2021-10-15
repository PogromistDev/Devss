#!/usr/bin/env node

var fs = require("fs");
var mime = require("mime-types");

var path = require("path");
var ip = require("ip");

var http = require("http");
var { spawnSync } = require("child_process");

const help = require("./help.txt");

// host:port

var host = ip.address();
var localhost = "127.0.0.1";
var port = 8080;

process.chdir(__dirname);

// processing command line arguments

for (let [index, arg] of process.argv.entries()) {

	if (arg == "-p") {
		port = parseInt(process.argv[index + 1]);
	}

	if (arg == "-h" || arg == "-a") {
		host = process.argv[index + 1];
	}

	if (["--help", "-?", "/?", "/help", "/h"].includes(arg)) {
		console.log(help);
		process.exit(0);
	}
}

// server creation

var server = http.createServer(requestHandler);

// start listening

try {
	server.listen(port, '0.0.0.0', 0, () => {
		console.log(`Running on ${localhost}:${port}`);
		console.log(`Running on ${host}:${port}`);
	});

}
catch(e) {
	console.error("Error:", e.message);
}

// error handler

server.on("error", (e) => {
	if (e.code === 'EADDRINUSE') {
		console.error(`${host}:${port} is already in use.`);
	}
});

// request handler

function executeScreenshotter(args, req, resp) {
	var result = spawnSync("app/devrantscreenshot", args, {});
	
	try {
		var buffer = fs.readFileSync("shot.png");
	}
	catch (e) {
		console.error("Error");

		resp.statusCode = 404;
		resp.end();
		return;
	}

	resp.writeHead(200, { "Content-Type": "image/png" });
	resp.write(buffer);
	resp.end();
}

function requestHandler(req, resp) {
	let filename = "";

	if (req.method == "GET") {

		// screenshot
	
		if (req.url == "/screenshot") {

			console.log(`Cropped screenshot [${req.connection.remoteAddress}]`);
			executeScreenshotter([], req, resp);
			return;
		}

		if (req.url == "/fullscreenshot") {
			console.log(`Full screenshot [${req.connection.remoteAddress}]`);
			executeScreenshotter(["--full-screen"], req, resp);
			return;
		}
	
		// root document
	
		filename = req.url;

		if (filename == "/") filename = "/web/index.html";
		
		// file request handling
	
		fs.readFile(filename.substring(1), (err, data) => {
			if (err) {
				resp.statusCode = 404;
				resp.end();
				return;
			}
			
			resp.statusCode = 200;
			resp.setHeader("Content-Type", mime.lookup(path.extname(filename)) || "application/octet-stream");
			resp.write(data);
			resp.end();
		});
	}
}
