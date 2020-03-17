// Run a node.js web server for local development of a static web site. Create a
// site folder, put server.js in it, create a sub-folder called "public", with
// at least a file "index.html" in it. Start the server with "node server.js &",
// and visit the site at the address printed on the console.
//     The server is designed so that a site will still work if you move it to a
// different platform, by treating the file system as case-sensitive even when
// it isn't (as on Windows and some Macs). URLs are then case-sensitive.
//     All HTML files are assumed to have a .html extension and are delivered as
// application/xhtml+xml for instant feedback on XHTML errors. Content
// negotiation is not implemented, so old browsers are not supported. Https is
// not supported. Add to the list of file types in defineTypes, as necessary.

// Change the port to the default 80, if there are no permission issues and port
// 80 isn't already in use. The root folder corresponds to the "/" url.
var port = 8080;
var root = "./public";

const validUrl = require('valid-url');
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(
  "./database/banks.db",
  sqlite3.OPEN_READWRITE,
  err => {
    if (err) {
      console.error(err.message);
    }
    console.log("Connected to the bank database.");
  }
);

// Load the library modules, and define the global constants and variables.
// Load the promises version of fs, so that async/await can be used.
// See http://en.wikipedia.org/wiki/List_of_HTTP_status_codes.
// The file types supported are set up in the defineTypes function.
// The paths variable is a cache of url paths in the site, to check case.
("use strict");
var http = require("http");
var fs = require("fs").promises;
var OK = 200,
  NotFound = 404,
  BadType = 415,
  Error = 500;
var types, paths;

// Start the server:
start();

// Check the site, giving quick feedback if it hasn't been set up properly.
// Start the http service. Accept only requests from localhost, for security.
// If successful, the handle function is called for each request.
async function start() {
  try {
    await fs.access(root);
    await fs.access(root + "/index.html");
    types = defineTypes();
    paths = new Set();
    paths.add("/");
    var service = http.createServer(handle);
    service.listen(port, "localhost");
    var address = "http://localhost";
    if (port != 80) address = address + ":" + port;
    console.log("Server running at", address);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

function remove_non_ascii(str) {

  if ((str===null) || (str===''))
       return false;
 else
   str = str.toString();

  return str.replace(/[^\x20-\x7E]/g, '');
}

// Serve a request by delivering a file.
function handle(request, response) {
  //find url and print
  var url = request.url.toLowerCase();
  url = remove_non_ascii(url);
  console.log("url=", url);

  if (url.endsWith("/")) url = url + "index.html";

  if (url.includes("/.")||url.includes("//")||!url.startsWith("/")||url.length>30) return fail(response, NotFound, "Invalid URL")

  if (url == "/banks") getList(response);

  else if (url.startsWith("/bank.html")) getBank(url, response);

  else getFile(url, response);
}

// Check if a path is in or can be added to the set of site paths, in order
// to ensure case-sensitivity.
async function checkPath(path) {
  if (!paths.has(path)) {
    var n = path.lastIndexOf("/", path.length - 2);
    var parent = path.substring(0, n + 1);
    var ok = await checkPath(parent);
    if (ok) await addContents(parent);
  }
  return paths.has(path);
}

// Add the files and subfolders in a folder to the set of site paths.
async function addContents(folder) {
  var folderBit = 1 << 14;
  var names = await fs.readdir(root + folder);
  for (var name of names) {
    var path = folder + name;
    var stat = await fs.stat(root + path);
    if ((stat.mode & folderBit) != 0) path = path + "/";
    paths.add(path);
  }
}

// Find the content type to respond with, or undefined.
function findType(url) {
  var dot = url.lastIndexOf(".");
  var extension = url.substring(dot + 1);
  extension = extension.split(/\#|\?/g)[0];
  return types[extension];
}

// Deliver the file that has been read in to the browser.
function deliver(response, type, content) {
  var typeHeader = { "Content-Type": type };

  if (type == "image/jpeg" || type == "image/png") {
    response.writeHead(OK, typeHeader);
    response.write(content);
    response.end();
  } else {
    response.writeHead(OK, typeHeader);
    response.write(String(content));
    response.end();
  }
}

// Give a minimal failure response to the browser
function fail(response, code, text) {
  var textTypeHeader = { "Content-Type": "text/plain" };
  response.writeHead(code, textTypeHeader);
  response.write(text, "utf8");
  response.end();
}

async function getBank(url, response) {
  var content = await fs.readFile("./templates/bank.html", "utf8");

  getData(content, url, response);
}

function getData(text, url, response) {
  var parts = url.split("=");
  var id = parts[1];

//   var check = "SELECT EXISTS(SELECT 1 FROM banks WHERE ID=" + id +")"
//
//   db.get(check, function(err, valid) {
//     console.log(valid)
//
//     if (valid==1){
//       var statement = "SELECT * FROM banks WHERE ID=" + id;
//
//       db.get(statement, function(err, row) {
//         callback(row);
//         // console.log(row);
//         prepare(text, row, response);
//       });}
//
//       else {
//         return fail(response, NotFound, "DB query error")
//       }
//
//
//
//
//   });
// }




  var statement = "SELECT * FROM banks WHERE ID=" + id;

  db.get(statement, function(err, row) {

    if(err){
      return fail(response, NotFound, "DB query error")
    }
    callback(row);
    console.log(row);
    prepare(text, row, response);
  });
}

function getList(response) {
  var statement = db.prepare("SELECT * from banks");
  statement.all(ready);
  function ready(err, list) {
    deliverList(list, response);
  }
}

function deliverList(list, response) {
  var text = JSON.stringify(list);
  deliver(response, "text/plain", text);
}

function callback(row) {
  //console.log("R:" + row);
}

function prepare(text, data, response) {
  //console.log(data.name);
  if (data == undefined) return fail(response, NotFound, "Database error")
  var parts = text.split("$");
  var page =
    parts[0] +
    data.name +
    parts[1] +
    data.id +
    parts[2] +
    data.name +
    parts[3] +
    data.name +
    parts[4];
  //console.log(page);
  deliver(response, "text/html", page);
}

async function getFile(url, response) {
  if (url.endsWith("/")) url = url + "index.html";
  var ok = await checkPath(url);
  if (!ok) return fail(response, NotFound, "URL not found (check case)");
  var type = findType(url);
  if (type == null) return fail(response, BadType, "File type not supported");
  var file = root + url;
  var content = await fs.readFile(file);
  deliver(response, type, content);
}

// The most common standard file extensions are supported, and html is
// delivered as "application/xhtml+xml".  Some common non-standard file
// extensions are explicitly excluded.  This table is defined using a function
// rather than just a global variable, because otherwise the table would have
// to appear before calling start().  NOTE: add entries as needed or, for a more
// complete list, install the mime module and adapt the list it provides.
function defineTypes() {
  var types = {
    html: "text/html",
    css: "text/css",
    js: "application/javascript",
    mjs: "application/javascript", // for ES6 modules
    png: "image/png",
    gif: "image/gif", // for images copied unchanged
    jpeg: "image/jpeg", // for images copied unchanged
    jpg: "image/jpeg", // for images copied unchanged
    svg: "image/svg+xml",
    json: "application/json",
    pdf: "application/pdf",
    txt: "text/plain",
    ttf: "application/x-font-ttf",
    woff: "application/font-woff",
    aac: "audio/aac",
    mp3: "audio/mpeg",
    mp4: "video/mp4",
    webm: "video/webm",
    ico: "image/x-icon", // just for favicon.ico
  };
  return types;
}
