// Define root folder
var root = "./public";

// Define some packages
("use strict");
const http = require("http");
const https = require("https");
const crypto = require("crypto");
const fs = require("fs").promises;
const fs_sync = require("fs");
const validUrl = require("valid-url");
const sqlite = require("sqlite-async");

// Define the private key and certificate for HTTPS
const security = {
  key: fs_sync.readFileSync("./certs/key.pem"),
  cert: fs_sync.readFileSync("./certs/certificate.pem")
};

// Define HTTP error codes
var OK = 200,
  NotFound = 404,
  BadType = 415,
  Error = 500;

// Final global variable definitions
var types, paths;
var db = undefined;

// Start the server:
start();

async function start() {
  try {
    // connect to bank database
    db = await sqlite.open("./database/banks.db");

    // checks if files exist
    await fs.access(root);
    await fs.access(root + "/index.html");

    // set our types and paths
    types = defineTypes();
    paths = new Set();
    paths.add("/");

    // create https service, listening on port 443 - send requests to handle function
    var service = https.createServer(security, handle);
    service.listen(443, "localhost");

    // create http serice , listening on port 80 - sends requests to http_redirect function
    var http_service = http.createServer(http_redirect);
    http_service.listen(80, "localhost");
  } catch (err) {
    // catch any errors
    console.log(err);
    process.exit(1);
  }
}

// redirects http requests to https service
function http_redirect(request, response) {
  var redirect = "https://localhost";

  response.writeHead(301, { Location: redirect });
  response.end();
}

// handles the requests, sending the request to relevant functions
function handle(request, response) {
  //find url, remove non ascii, add index
  var url = request.url.toLowerCase();
  url = remove_non_ascii(url);
  if (url.endsWith("/")) url = url + "index.html";

  // print details about request
  console.log("method=", request.method);
  console.log("url=", url);
  console.log("headers=", request.header);

  // request file type validation -> can only be the types defined here
  if (
    !url.endsWith(".html") &&
    !url.endsWith(".js") &&
    !url.endsWith(".css") &&
    !url.endsWith(".png") &&
    !url.endsWith(".ico") &&
    !url.endsWith(".jpg") &&
    !url.includes("bank.html?id=") &&
    !url.endsWith("banks") &&
    !url.startsWith("/search")
  )
    return fail(response, BadType, "Bad request type");

  // validtae url requests to prevent filesystem access
  if (
    url.includes("/.") ||
    url.includes("//") ||
    !url.startsWith("/") ||
    url.length > 30
  )
    return fail(response, NotFound, "Illegal URL");

  //call to get the list of banks for the home page
  if (url == "/banks") getList(response);
  // call to get a specific bank's page
  else if (url.startsWith("/bank.html")) getBank(url, response);
  else if (url.startsWith("/search")) getSearch(url, response);
  // call for any other url request
  else getFile(url, response);
}

// function to get list of banks for homepage.
async function getList(response) {
  //prepared statement to get all banks
  var statement = await db.prepare("SELECT * from banks");
  var list = await statement.all();

  // convert to JSON string and send to deliver
  var text = JSON.stringify(list);
  deliver(response, "text/plain", text);
}

async function getSearch(url, response) {
  var parts = url.split("=");
  var searchQuery = decodeURI(parts[1]);

  //prepared statement to get all banks
  var statement = "SELECT * from banks WHERE name LIKE '%" + searchQuery + "%'";
  console.log(statement);
  try {
    //get row from db, and sent to prepare
    var list = await db.all(statement);
    console.log(list);

    var text = JSON.stringify(list);
    deliver(response, "text/plain", text);
  } catch (err) {
    //if theres an error, call fail
    return fail(response, NotFound, "DB query error");
  }
}

// function to get a speicific banks's page.
async function getBank(url, response) {
  //get bank template
  var content = await fs.readFile("./templates/bank.html", "utf8");

  // get the bank id from the url
  var parts = url.split("=");
  var id = parts[1];

  //prepared statement using the id from url
  var statement = "SELECT * FROM banks WHERE ID=" + id;

  try {
    //get row from db, and sent to prepare
    var row = await db.get(statement);
    console.log(row);
    prepare(content, row, response);
  } catch (err) {
    //if theres an error, call fail
    return fail(response, NotFound, "DB query error");
  }
}

// function to prepare the bank template with the gathered db info for that bank
function prepare(text, data, response) {
  //db check so that it does not crash if can't find the data
  if (data == undefined) return fail(response, NotFound, "Database error");

  // insert the db data into the relevant template places
  var parts = text.split("$");
  var page =
    parts[0] +
    data.name +
    parts[1] +
    data.id +
    parts[2] +
    data.name +
    parts[3] +
    data.link +
    parts[4] +
    data.facebook +
    parts[5] +
    data.linkedin +
    parts[6] +
    data.description +
    parts[7];

  // send the completed page to deliver
  deliver(response, "text/html", page);
}

// function to get any file that isnt a bank
async function getFile(url, response) {
  // get index page if ..../
  if (url.endsWith("/")) url = url + "index.html";

  // check url is ok
  var ok = await checkPath(url);
  if (!ok) return fail(response, NotFound, "URL not found (check case)");

  // get type of url
  var type = findType(url);
  if (type == null) return fail(response, BadType, "File type not supported");

  // get relative patch of ile, and read into contents
  var file = root + url;
  var content = await fs.readFile(file);

  // pass contents to deliver
  deliver(response, type, content);
}

// Deliver the file that has been read in to the browser.
function deliver(response, type, content) {
  // input the type into the header for the response
  var typeHeader = { "Content-Type": type };

  // respond with images
  if (type == "image/jpeg" || type == "image/png") {
    response.writeHead(OK, typeHeader);
    response.write(content);
    response.end();
  }

  // respond with text
  else {
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
    ico: "image/x-icon" // just for favicon.ico
  };
  return types;
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

// removes any non ascii characters from a string
function remove_non_ascii(str) {
  if (str === null || str === "") return false;
  else str = str.toString();

  return str.replace(/[^\x20-\x7E]/g, "");
}
