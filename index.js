const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const Server = require('node-git-server');
const axios = require('axios');

const addToIPFS = require('./utilities/addToIPFS');

const cors = require('cors');
const port = process.env.PORT || 5000;

const repos = new Server(path.resolve(__dirname), {
    autoCreate: true
});
const port2 = process.env.PORT || 7005;



// route imports:
const initProj = require('./routes/initProj');
const gitGraph = require('./routes/gitGraph');
const deleteProj = require('./routes/deleteProj');

const getFiles = require('./routes/getFiles');
const deleteFile = require('./routes/deleteFile');
const commitFile = require('./routes/commitFile');
const diffFiles = require('./routes/diffFiles');
const diffForCommit = require('./routes/diffForCommit');
const mergeBranch = require('./routes/mergeBranch');
const fileCommitHistory = require('./routes/fileCommitHistory');
const readFile = require('./routes/readFile');

const addBranch = require('./routes/addBranch');
const getBranches = require('./routes/getBranches');
const deleteBranch = require('./routes/deleteBranch');
const branchCommitHistory = require('./routes/branchCommitHistory');

const getMergeObj = require('./routes/getMergeObj');
const mergeCommit = require('./routes/mergeCommit');
const readMergeFiles = require('./routes/readMergeFiles');
const checkoutBranch = require('./routes/checkoutBranch');
const downloadRepo = require('./routes/downloadRepo');
const downloadForCLI = require('./routes/downloadForCLI');
const deleteMergeRequest = require('./routes/deleteMergeRequest');

// Client Document operation routes:
const createDocument = require('./ipfsRoutes/createDocument');
const readDocument = require('./ipfsRoutes/readDocument');
const downloadDocument = require('./ipfsRoutes/downloadDocument');

app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname,'routes', 'sample.html')));
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname,'routes','sample.html'));
});

app.post('/initProj', initProj);
app.post('/gitGraph', gitGraph); 
app.post('/downloadRepo', downloadRepo);
app.post('/deleteProj', deleteProj);

app.post('/getFiles',getFiles);
app.post('/deleteFile',deleteFile);
app.post('/commitFile',commitFile);
app.post('/diffFiles', diffFiles);
app.post('/diffForCommit', diffForCommit);
app.post('/mergeBranch', mergeBranch); 
app.post('/fileCommitHistory', fileCommitHistory);
app.post('/readFile',readFile);

app.post('/addBranch', addBranch);
app.post('/getBranches', getBranches);
app.post('/deleteBranch', deleteBranch);
app.post('/branchCommitHistory', branchCommitHistory);

app.post('/getMergeObj', getMergeObj);
app.post('/mergeCommit', mergeCommit);
app.post('/readMergeFiles', readMergeFiles);
app.post('/checkoutBranch', checkoutBranch);
app.post('/downloadForCLI', downloadForCLI);
app.post('/deleteMergeRequest', deleteMergeRequest);

app.post('/createDocument', createDocument);
app.post('/readDocument', readDocument);
app.post('/downloadDocument', downloadDocument);

repos.on('push', async (push) => {
    push.accept();
    /*let majorHash = '';
    let projName = push.repo.split('bare/')[1].split('.git')[0];
    let barerepopath = path.resolve(__dirname, 'projects', 'bare', projName+'.git'); 
    await addToIPFS(barerepopath)
    .then( (mjrHash) => {
        console.log("MajorHash (git push): ", mjrHash);
        majorHash = mjrHash 
    })
    let url = 'http://localhost:4000/updateHash'
    await axios.post(url, {
        projid: projName,
        hash: majorHash
    })*/
    console.log(`${projName} \n ${majorHash}`);
    //console.log(`push ${push.repo}/${push.commit} (${push.branch})`);
});

process.on('uncaughtException', (err) => {
    
})
repos.on('fetch', async (fetch) => {
    //console.log('fetch object: ',fetch);
    console.log(`fetch ${fetch.repo}/${fetch.commit} (${fetch.branch})`);
    fetch.accept();
});

repos.on('clone', (clone) => {
    //console.log('clone object: ',clone);
    clone.accept();
})

repos.listen(port2, () => {
    console.log(`node-git-server running at http://localhost:${port2}`);
});

app.listen(port,()=>{
    console.log("Started NodeJS server on "+port);
})
