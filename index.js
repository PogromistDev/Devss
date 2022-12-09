#!/usr/bin/env node

const fs = require("fs");
const mime = require("mime-types");

const path = require("path");
const ip = require("ip");

const http = require("http");
const { spawnSync } = require("child_process");

const QRCode = require('qrcode');

const help = require("./help.txt");

// host:port

var host = "";
var externalAddress = false;

const localhost = "127.0.0.1";
var port = 8080;

var showQR = false;

process.chdir(__dirname);

// processing command line arguments

for (let [index, arg] of process.argv.entries()) {


	if (["-n", "--name", "--in", "--interface-name"].includes(arg)) {
		try {
			host = ip.address(process.argv[index + 1]);
			externalAddress = true;
		}
		catch (e) {
			externalAddress = false;
		}
		continue;
	}

	if (["-p", "--port"].includes(arg)) {
		port = parseInt(process.argv[index + 1]);
		continue;
	}

	if (["-a", "-h", "--ip", "--address", "--host", "--ip-address"].includes(arg)) {
		host = process.argv[index + 1];
		externalAddress = true;
		continue;
	}

	if (["--help", "-?", "/?", "/help", "/h"].includes(arg)) {
		console.log(help);
		process.exit(0);
	}

	if (["--show-qr-code", "--qr"].includes(arg)) {
		showQR = true;
		continue;
	}
}

// server creation

var server = http.createServer(requestHandler);

// start listening

try {
	server.listen(port, '0.0.0.0', 0, () => {
		console.log(`Running on ${localhost}:${port}`);
		if (externalAddress) {
			console.log(`Running on ${host}:${port}`);
			if (showQR) {

				QRCode.toString(`http://${host}:${port}`, { type: 'terminal' }, (err, url) => {
					if (!err) console.log("\n" + url);
				});

			}
		}
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
