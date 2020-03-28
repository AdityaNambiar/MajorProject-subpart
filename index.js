const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

// Terminal execution import
const { exec, spawn, spawnSync, execSync } = require('child_process');

const cors = require('cors');
const port = process.env.PORT || 5000;

// route imports:
const initProj = require('./routes/initProj');
const gitGraph = require('./routes/gitGraph');

const addFile = require('./routes/addFile');
const getFiles = require('./routes/getFiles');
const commitFile = require('./routes/commitFile');

const addBranch = require('./routes/addBranch');
const getBranches = require('./routes/getBranches');
const deleteBranch = require('./routes/deleteBranch');
const checkoutBranch = require('./routes/checkoutBranch');

app.use(cors());
app.use(bodyParser.json());

app.get('/',() => {
    console.log("Home");
})

app.post('/initProj', initProj);
app.post('/gitGraph', gitGraph); 

app.post('/addFile', addFile);
app.post('/getFiles',getFiles);
app.post('/commitFile',commitFile);

app.post('/addBranch', addBranch);
app.post('/getBranches', getBranches);
app.post('/deleteBranch', deleteBranch);
app.post('/checkoutBranch', checkoutBranch);

// The below route is the one with isomorphic-git's method:
app.post('/mergeBranches', async (req,res) => {
    const projLeader = "Aditya" // Hard coded - has to card name or from blockchain?
    var projName = req.body.projName;
    var branchName = req.body.name;
    var majorHash = '';
    // IPFS work:
    try{
        fs.exists(path.join(__dirname, projLeader, projName), async (exists) => 
        { 
            if (!exists) getFromIPFS(majorHash); 
            else {
                // Git work:
                try{ 
                    let source_branch = branchName;
                    await git.merge({
                        fs,
                        dir:  path.join(__dirname, projLeader, projName),
                        ours: 'master',
                        theirs: source_branch,
                    })
                    console.log(`Merged branch ${source_branch} with master.`)
                    res.status(200).send({message: "Merge Branches successful"});
                }catch(e){
                    console.log("mergeBranch git err: ", e);
                    res.status(400).send(e);
                }
            }
        })
    } catch(e) {
        console.log("mergeBranches main err: ", e);
    }
})
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
app.post('/mergeFiles', (req,res) => {
    const projLeader = "Aditya" // Hard coded - has to card name or from blockchain?
    var projName = "app" || req.body.projName;
    var branchName = 'feature' || req.body.name; // Hard coded - has to fetch as: req.body.branchName
    var majorHash = '';
    // IPFS work:
    try{
        fs.exists(path.join(__dirname, projLeader, projName), async (exists) => 
        { 
            if (!exists) getFromIPFS(majorHash); 
            else {
                // Git work:
                try {
                    exec('git merge '+branchName , {
                        cwd: path.join(__dirname),
                        shell: true,
                    }, (err, stdout, stderr) => {
                        if (err) console.log("mergeFiles err: \n", err);
                        if (stderr) console.log("mergeFiles stderr: \n", err);
                        console.log("RESULTS: \n",stdout);
                    });
                    res.status(200).send(execout);
                }catch(e){
                    console.log("mergeBranch git err: ",e);
                    res.status(200).send(e);
                }
            }
        })
    } catch(e) {
        console.log("mergeBranch main err: ", err);
    } 
}) 

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