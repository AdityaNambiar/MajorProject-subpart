const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const cors = require('cors');
const port = process.env.PORT || 5000;

const path = require('path');
const Server = require('node-git-server');

// utility import:
const pushToBare = require('./utilities/pushToBare');


// route imports:
const initProj = require('./routes/initProj');
const gitGraph = require('./routes/gitGraph');
const downloadRepo = require('./routes/downloadRepo');

const getFiles = require('./routes/getFiles');
const commitFile = require('./routes/commitFile');
const diffFiles = require('./routes/diffFiles');
const mergeFiles = require('./routes/mergeFiles');
const fileCommitHistory = require('./routes/fileCommitHistory');
const readForBuffer = require('./routes/readForBuffer');

const addBranch = require('./routes/addBranch');
const getBranches = require('./routes/getBranches');
const deleteBranch = require('./routes/deleteBranch');
const branchCommitHistory = require('./routes/branchCommitHistory');

const pushChecker = require('./routes/pushChecker');
const statusChecker = require('./routes/statusChecker');



app.use(cors());
app.use(bodyParser.json());

app.get('/',() => {
    console.log("Home");
})

app.post('/initProj', initProj);
app.post('/gitGraph', gitGraph); 
app.post('/downloadRepo', downloadRepo);

app.post('/getFiles',getFiles);
app.post('/commitFile',commitFile);
app.post('/diffFiles', diffFiles);
app.post('/mergeFiles', mergeFiles); 
app.post('/fileCommitHistory', fileCommitHistory);
app.post('/readForBuffer',readForBuffer);

app.post('/addBranch', addBranch);
app.post('/getBranches', getBranches);
app.post('/deleteBranch', deleteBranch);
app.post('/branchCommitHistory', branchCommitHistory);

app.post('/pushChecker', pushChecker);
app.post('/statusChecker', statusChecker);

const repos = new Server(path.resolve(__dirname), {
    autoCreate: true
});
const port2 = process.env.PORT || 7005;
/**
 * Git merge procedure:
 * 1. Get the leader's folder (just to get the git repo inside it) from IPFS
 * 2. Perform merge as written in the below route
 * 3. (In case of Merge conflict) Get the conflicting file names: 
 *      a. Convert the lines of string into string array
 *      b. Split and put the file names in the output to a seperate array. (So that it can be displayed on frontend)
 *      c. Fetch the file contents of each file in the conflict (i.e. iterate the above obtained array and store their content in another array)
 * 4. Now the user has to be told to resolve the conflicts and Click on 'Save' and 'Apply' to 'git add file' and 'git commit file' respectively. (direct the routes of these buttons to the git API of addFile, without check and with check for commit) 
 */

repos.on('push', (push) => {
    console.log('push object: ',push)
    console.log(`push ${push.repo}/${push.commit} (${push.branch})`);
    push.accept();
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