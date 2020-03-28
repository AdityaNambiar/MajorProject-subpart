const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

// Terminal execution import
const { exec, spawn, spawnSync, execSync } = require('child_process');

// isomorphic-git related imports and setup
const git = require('isomorphic-git');
git.plugins.set('fs',fs); // Bring your own file system 

// ipfs related import and setup
const ipfsClient = require('ipfs-http-client');
const ipfs = ipfsClient({host: '127.0.0.1', port: '5001'});

const cors = require('cors');
const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// routes:
app.get('/',() => {
    console.log("Home");
})

/**
 * What to do for IPFS? :
 * Just create a code-base structure as follows:
 * -- Do a IPFS.get() to download the project from IPFS repo.
 * -- Perform actions written within routes below
 * -- Do a IPFS.add() and IPFS.pin() to upload / store the project back on IPFS repo.
 */

/**
 * IPFS action for initialization:
 * 1. Create project directory by Leader's name
 * 2. Initialize a git repository within this directory.
 * 3. Perform IPFS.add() and IPFS.pin().
 */
var majorHash = '';
const projLeader = "Aditya" // Hard coded - has to card name or from blockchain?

async function addToIPFS(projLeader, projName){
    // IPFS.add() projectLeader's folder:
    let files = [];
    let fileobj = {
        path: `${projLeader}/${projName}`,
    }
    files.push(fileobj);
    await ipfs.add(Array.from(files), async (err, results)=>{
        if (err) console.log("IPFS ADD Err: ",err);
        console.log("IPFS ADD results: ",results);

        hash = results[results.length - 1].hash; // Access hash of only the Leader's directory (which is the last element of results)
        majorHash = hash;
        await ipfs.pin.add(hash, (err, res) => { 
            if(err) console.log("IPFS PIN Err: ", err);
            console.log("IPFS PIN res: ", res[0].hash); // Hash after pinning the Leader's directory.
        });
        
        console.log("Save this majorHash: ",majorHash);  
    })
}

async function getFromIPFS(majorHash){
    await ipfs.get(majorHash, async (err, results) => {
        if (err) throw new Error("addFile - ipfs.get:\n", err);
        var leader_dirpathhash = results[0].path
        execSync(`ipfs get ${leader_dirpathhash} -o ${projLeader}`, {
            cwd: __dirname,
            shell: true,
        });
    });
}
app.post('/initProj', 
    async(req,res) => {
        try {
            // Create project folder with provided leader's name
            fs.mkdir(path.join(__dirname, projLeader), (err)=>{
                if (err) console.log("mkdir (leader's folder) err: ",err);
                // Create actual project folder with leader's 
                fs.mkdir(path.join(__dirname, projLeader, req.body.projName), async (err) => {
                    if (err) console.log("mkdir (proj folder) err: ", err);
                    // Initialize this folder as git repo 
                    try{
                        await git.init({
                            fs,
                            dir: path.join(__dirname, projLeader, req.body.projName)
                        });
                        res.status(200).send({message:"git init done"});
                    }catch(e){
                        console.log("git init err: ",e);
                        res.status(400).send(e)
                    }
                })
                addToIPFS(projLeader,req.body.projName);
            })
        } catch (err) {
            console.log("git init outer catch err: ", err)
        }
    }
)
app.post('/addBranch', async (req,res) => {
    try {
        await git.branch({
            dir:  path.join(__dirname, projLeader, req.body.projName),
            ref: req.body.name
        })
        res.status(200).send({message: "Add Branch successful"});
    }catch(e){
        console.log("ERR: ",e);
        res.status(400).send(e);
    }
});
app.post('/addFile', async (req,res) => {
    majorHash = 'QmPkJRJzcvXApgMoJBsWx2Vi4HdPUxmtpkoBNPc5SPVQoQ';
    // IPFS work:
    try{
        fs.exists(path.join(__dirname, projLeader, req.body.projName), async (exists) => 
        { 
            if (!exists) getFromIPFS(majorHash); 
            else {
                // Git work:
                let buffer = req.body.filebuff;
                let filename = req.body.filename;
                let ac_status = req.body.autocomm_status;
                let usermsg = req.body.comm_msg;

                fs.writeFileSync(path.join(__dirname, projLeader, req.body.projName,filename),Buffer.from(buffer));
                try {
                    let files = await git.add({
                        dir:  path.join(__dirname, projLeader, req.body.projName),
                        filepath: filename
                    })
                    console.log(`File added is -> ${filename}`);

                    if (ac_status) { // if auto-commit is true i.e. user wants to commit when they add this file...
                        let sha = await git.commit({
                            fs,
                            dir:  path.join(__dirname, projLeader, req.body.projName),
                            message: usermsg,
                            author: {
                                name: "Aditya",
                                email: "adi@g.c"
                            }
                        })
                        console.log("commit hash: \n",sha);
                    }
                    res.status(200).send({message: "Add / Commit successful", data: files});
                }catch(e){
                    console.log("addFile ERR: ",e);
                    res.status(400).send(e);
                }
            }   
        })
    }catch(err){
        console.log("addFile - ipfs.get:\n",err);
        res.status(400).send(e);
    }
});
app.post('/getBranches', async (req,res) => {
    try {
        let branches = await git.listBranches({
            dir:  path.join(__dirname, projLeader, req.body.projName)
        })
        res.status(200).send(branches);
    }catch(e){
        console.log("getbranch ERR: ",e);
        res.status(400).send(e);
    };
});

app.post('/deleteBranch', async (req,res) => {
    try {
        await git.deleteBranch({
            dir:  path.join(__dirname, projLeader, req.body.projName),
            ref: req.body.name
        })
        res.status(200).send({message: "Delete Branch successful"});
    }catch(e){
        console.log("ERR: ",e);
        res.status(400).send(e);
    }
});

app.post('/checkoutBranch', async (req,res) => {
    try {
        await git.checkout({
            dir:  path.join(__dirname, projLeader, req.body.projName),
            ref: req.body.name,
        });
        console.log("Checked out to: ", req.body.name);
        res.status(200).send({message: "Branch checkout successful"});
    }catch(e){
        console.log("checkoutBranch ERR: ",e);
        res.status(400).send(e);
    }
});

app.post('/getFiles', async (req,res) => {
    try {
        let files = await git.listFiles({
            dir:  path.join(__dirname, projLeader, req.body.projName),
            ref: 'HEAD'
        })
        console.log("Files on selected branch: ",files);
        res.status(200).send({message: "Fetch files on current branch (where HEAD ptr is at) successful", data: files});
    }catch(e){
        console.log("getFiles ERR: ",e);
        res.status(400).send(e);
    }
});
// The below route is the one with isomorphic-git's method:
app.post('/mergeBranches', async (req,res) => {
    try{ 
        let source_branch = req.body.name;
        await git.merge({
            fs,
            dir:  path.join(__dirname, projLeader, req.body.projName),
            ours: 'master',
            theirs: source_branch,
        })
        console.log(`Merged branch ${source_branch} with master.`)
        res.status(200).send({message: "Merge Branches successful"});
    }catch(e){
        console.log("ERR mergeBranch: ", e);
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
    try {
        var branchName = 'feature'; // Hard coded - has to fetch as: req.body.branchName
        var execout = execSync('git merge '+branchName , {
            cwd: path.join(__dirname, projLeader, req.body.projName),
            shell: true,
        });
        //console.log(execout);
        res.status(200).send(execout);
    }catch(e){
        console.log("gitgraph err: ",e);
        res.status(200).send(e);
    }
}) 
app.post('/gitGraph', (req,res) => {
    try {
        let output = '';
        var execout = execSync('git log --all --graph --decorate --oneline', {
            cwd: path.join(__dirname, projLeader, req.body.projName),
            shell: true,
        });
        //console.log(execout);
        res.status(200).send(execout);
    }catch(e){
        console.log("gitgraph err: ",e);
        res.status(200).send(e);
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