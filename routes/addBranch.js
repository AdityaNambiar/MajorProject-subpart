/**
 * Add a new branch in git repo:
 */
// Misc:
const preRouteChecks = require('../utilities/preRouteChecks');
const pushChecker = require('../utilities/pushChecker');

const { exec } = require('child_process');

// isomorphic-git related imports and setup
const fs = require('fs-extra');
const git = require('isomorphic-git');
git.plugins.set('fs',fs); // Bring your own file system 

const path = require('path');
const express = require('express');
const router = express.Router();

router.post('/addBranch', async (req,res) => {
    var projName = req.body.projName.replace(/\s/g,'-');
    var username = req.body.username.replace(/\s/g,'-');
    var curr_majorHash = req.body.majorHash;  // latest
    var branchToUpdate = req.body.branchToUpdate.replace(/\s/g,'-');
    var branchName = req.body.branchName.replace(/\s/g,'-');
    var upstream_branch = 'origin/master';
    var url = `http://localhost:7005/projects/bare/${projName}.git`;

    var timestamp = Date.now();

    var barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git'); 
    var workdirpath = path.resolve(__dirname, '..', 'projects', projName, branchToUpdate, username+timestamp);

    try{
        await preRouteChecks(curr_majorHash, projName, username, timestamp, branchToUpdate)
        let response = await main(projName, timestamp, barerepopath, workdirpath, curr_majorHash, branchName, branchToUpdate, upstream_branch, url)
        res.status(200).send(response);
    }catch(err){
        console.log(err);
        res.status(400).send(`main caller err ${err.name}: ${err.message}`);
    }
})

function main(projName, timestamp, barerepopath, workdirpath, curr_majorHash, branchName, branchToUpdate, upstream_branch, url){
    return new Promise ( async (resolve, reject) => {
        try {
            const newBranchNamePath = await gitBranchAdd(workdirpath, branchName, branchToUpdate, projName)
            await branchNamePathCheck(newBranchNamePath)  // Prepares the branchNamePath for new branch name.
            const newWorkDirPath = await moveWorkDir(timestamp, workdirpath, newBranchNamePath) // Moves workdir to new branch name path to proceed with rest ops.
            await setUpstream(newWorkDirPath, upstream_branch);
            const files = await gitListFiles(newWorkDirPath);
            const responseobj = await pushChecker(barerepopath, newWorkDirPath, timestamp, curr_majorHash); 
            console.log("pushchecker returned this: \n", responseobj);
            resolve({
                projName: projName, 
                majorHash: responseobj.ipfsHash, 
                statusLine: responseobj.statusLine, 
                mergeArr: responseobj.mergeArr, 
                url: url,
                files: files
            });
        } catch(err) {
            console.log(err);
            reject(`main err ${err.name} :- ${err.message}`);
        }
    })
}


function branchNamePathCheck(branchNamepath) {
    return new Promise( (resolve, reject) => {
        if (!fs.existsSync(branchNamepath)){
            fs.mkdir(branchNamepath, (err) => {
                if (err) { 
                    console.log(err);
                    reject(`branchNamePathCheck err ${err.name} :- ${err.message}`);
                }
                resolve(true);
            })
        }
        resolve(true); // means projects/projName/branchName exists
    })
}

function moveWorkDir(timestamp, workdirpath, newBranchNamePath) {
    // .../projects/projName/branchName/username+timestamp
    var username, timestamp, pathArr;
    pathArr = workdirpath.split('/');
    username = pathArr[pathArr.length - 1].split(timestamp)[0]; 
    let dir_name = username+timestamp;

    return new Promise( (resolve, reject) => {
        let newWorkDirPath = path.join(newBranchNamePath, dir_name);
        try {
            fs.move(workdirpath, newWorkDirPath, (err) => {
                if (err) { console.log(err); reject(`fs.move err ${err.name} :- ${err.message}`); }
                resolve(newWorkDirPath);
            })
        } catch(err) {
            console.log(err);
            reject(`moveWorkDir err ${err.name} :- ${err.message}`);
        }
    })
}

function gitBranchAdd(workdirpath, branchName, branchToUpdate, projName) {
    console.log("workdir: ",workdirpath);
    return new Promise (async (resolve, reject) => {
        try {
            let newBranchNamePath = "";
            await git.branch({
                dir: workdirpath,
                ref: branchName,
                checkout: true
            })
            branchToUpdate = branchName;
            newBranchNamePath = path.resolve(__dirname, '..', 'projects', projName, branchToUpdate);
            resolve(newBranchNamePath);
        } catch(err) {
            console.log(err); 
            reject(`git-branch err ${err.name} :- ${err.message}`);
        }
    })
}

function setUpstream(workdirpath, upstream_branch) {
    return new Promise(async (resolve, reject) => {
        try {
            await exec(`git branch --set-upstream-to=${upstream_branch}`, {
                cwd: workdirpath,
                shell: true
            }, (err, stdout, stderr) => {
                if (err) { console.log(err); reject(`git-setupstream err ${err.name} :- ${err.message}`); }
                if (stderr) { console.log(stderr); reject(`git-setupstream stderr: ${stderr}`); }
                console.log(stdout);
            })
            resolve(true);
        } catch(err) {
            console.log(err);
            reject(`git-branch-setUpstream err ${err.name} :- ${err.message}`);
        } 
    })
}

function gitListFiles(workdirpath) {
    let command = `FILES="$(git ls-tree --name-only HEAD .)";IFS="$(printf "\n\b")";for f in $FILES; do    str="$(git log -1 --pretty=format:"%s%x28%x7c%x29%x2D%x7c%x2D%x28%x7c%x29%cr" $f)";  printf "%s(|)-|-(|)%s\n" "$f" "$str"; done`;
    return new Promise (async (resolve, reject) => {
        try {
            await exec(command, {
                cwd: workdirpath,
                shell: true
            }, (err,stdout,stderr) => {
                if(err) { console.log(err); reject(`git-ls-tree cli err ${err.name} :- ${err.message}`); }
                //if(stderr) {console.log('stderr: '+stderr);reject(`git-ls-tree cli stderr: ${stderr}`);}
                
                /**
                 * 1. Convert stdout to string array
                 * 2. Split by '(|)-|-(|)' seperator. Had to decide upon a weirdest symbol - my imaginations are helpful with this. Thanks lenny face.
                 * 3. create an object and pass it out of this function in resolve().
                 */
                let files = [];
                stdout.trim().split('\n').forEach( output_arr => {
                    let file = output_arr.split('(|)-|-(|)')[0];
                    let commitmsg = output_arr.split('(|)-|-(|)')[1];
                    let time = output_arr.split('(|)-|-(|)')[2];
                    let obj = { file: file, commitmsg: commitmsg, time: time}
                    files.push(obj);
                })
                resolve(files);
            })
        }catch(err){
            console.log(err);
            reject(`git-ls-tree err ${err.name} :- ${err.message}`);
        }
    })
}

module.exports = router;
