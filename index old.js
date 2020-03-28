const express = require('express');
const app = express(); // Only for testing
const bodyParser = require('body-parser'); // Only for testing
const { exec, spawn } = require('child_process');

const terminal = require('hypernal')(); // To show process.stdout (using this to obtain colors too) on browser.
// REFER Hypernal docs: https://github.com/thlorenz/hypernal (to be used on frontend)

const git = require('isomorphic-git');
const fs = require('fs');
var http = require('http'); // Only for testing

git.plugins.set('fs',fs); // Bring your own file system 

const cors = require('cors');
const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
 
var mygraph = "";
(async () => {
    var gitgraph = spawn('git log',['--all', '--graph', '--decorate', '--oneline'], {
        cwd: "../gittest",
        shell: true,
        stdio: [process.stdin, process.stdout, 'pipe']
    });
    mygraph = "";
process.stdout.on('data', (data) => {
mygraph = data;
});
})()

console.log("MY GRAPH: \n", mygraph);
http.createServer(function (req, res) {
    var html = buildHtml(req);
  
    res.writeHead(200, {
      'Content-Type': 'text/html',
      'Content-Length': html.length
    });
    res.end(html);
  }).listen(6565);

function buildHtml(req) {
    var header = '';
    var body = terminal.write(mygraph);
  
    // concatenate header string
    // concatenate body string
  
    return '<!DOCTYPE html>'
         + '<html><head>' + header + '</head><body><div id="term">' + body + '</div></pre></body></html>';
};
// app.listen(port,()=>{
//     console.log("Started NodeJS server on "+port);
// })