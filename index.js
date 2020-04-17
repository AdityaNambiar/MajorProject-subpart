const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const Server = require('node-git-server');

const cors = require('cors');
const port = process.env.PORT || 5000;

const repos = new Server(path.resolve(__dirname), {
    autoCreate: true
});
const port2 = process.env.PORT || 7005;



// route imports:
const initProj = require('./routes/initProj');
const gitGraph = require('./routes/gitGraph');
const downloadRepo = require('./routes/downloadRepo');
//const downloadBareRepo = require('./routes/downloadBareRepo');
const deleteProj = require('./routes/deleteProj');

const getFiles = require('./routes/getFiles');
const deleteFile = require('./routes/deleteFile');
const commitFile = require('./routes/commitFile');
const diffFiles = require('./routes/diffFiles');
const diffForCommit = require('./routes/diffForCommit');
const mergeFiles = require('./routes/mergeFiles');
const fixConsistency = require('./routes/fixConsistency');
const fileCommitHistory = require('./routes/fileCommitHistory');
const readFile = require('./routes/readFile');

const addBranch = require('./routes/addBranch');
const getBranches = require('./routes/getBranches');
const deleteBranch = require('./routes/deleteBranch');
const branchCommitHistory = require('./routes/branchCommitHistory');

const pushChecker = require('./routes/pushChecker');
const checkoutBranch = require('./routes/checkoutBranch');



app.use(cors());
app.use(bodyParser.json());

app.get('/',() => {
    console.log("Home");
})

app.post('/initProj', initProj);
app.post('/gitGraph', gitGraph); 
app.post('/downloadRepo', downloadRepo);
//app.post('/downloadBareRepo', downloadBareRepo);
app.post('/deleteProj', deleteProj);

app.post('/getFiles',getFiles);
app.post('/deleteFile',deleteFile);
app.post('/commitFile',commitFile);
app.post('/diffFiles', diffFiles);
app.post('/diffForCommit', diffForCommit);
app.post('/mergeFiles', mergeFiles); 
app.post('/fixConsistency', fixConsistency);
app.post('/fileCommitHistory', fileCommitHistory);
app.post('/readFile',readFile);

app.post('/addBranch', addBranch);
app.post('/getBranches', getBranches);
app.post('/deleteBranch', deleteBranch);
app.post('/branchCommitHistory', branchCommitHistory);

app.post('/pushChecker', pushChecker);
app.post('/checkoutBranch', checkoutBranch);

repos.on('push', (push) => {
    console.log('push object: ',push)
    console.log(`push ${push.repo}/${push.commit} (${push.branch})`);
    push.accept();
});

repos.on('fetch', (fetch) => {
    console.log('push object: ',fetch)
    console.log(`fetch ${fetch.repo}/${fetch.commit} (${fetch.branch})`);
    fetch.accept();
});

repos.listen(port2, () => {
    console.log(`node-git-server running at http://localhost:${port2}`)
});

app.listen(port,()=>{
    console.log("Started NodeJS server on "+port);
})






/* 
 --- This below code snippet gives colored output for branch. But the color is first of all applied by the parent terminal (which is "process.stdout" and not in subprocess.stdout which is actually what spawn brings up..)
 --- Only problem is getting the value of variable 'output' out of node and get in react.
app.get('/gitGraph', (req,res) => {
    let output = '';
    var gitgraph = spawnSync('git log', ['--all','--graph','--decorate','--oneline'], {
        cwd: "../gittest",
        shell: true,
        stdio: [process.stdin, process.stdout, 'pipe']
    });
    const originalStdoutWrite = process.stdout.write.bind(process.stdout);

    process.stdout.write = (chunk, encoding, callback) => {
        if (typeof chunk === 'string') {
            output += chunk;
        }
        gitgraph.stdout.on("data", (data) => {
            console.log("DATA: ",data);
        })
        console.log(output);
        
        return originalStdoutWrite(chunk, encoding, callback);
    };
    process.stdout.write = originalStdoutWrite;
    res.status(200).send(output);

})*/