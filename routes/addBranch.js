/**
 * Add a new branch in git repo:
 */
// Misc:
const preRouteChecks = require('../utilities/preRouteChecks');
const pushChecker = require('../utilities/pushChecker');

const { exec } = require('child_process');

// isomorphic-git related imports and setup
const fs = require('fs');
const git = require('isomorphic-git');
git.plugins.set('fs',fs); // Bring your own file system 

const path = require('path');
const express = require('express');
const router = express.Router();


var projName, workdirpath, curr_majorHash, 
    username, branchToUpdate, branchName, 
    upstream_branch, barerepopath, 
    timestamp, url;

router.post('/addBranch', async (req,res) => {
    projName = req.body.projName.replace(/\s/g,'-');
    username = req.body.username.replace(/\s/g,'-');
    curr_majorHash = req.body.majorHash;  // latest
    branchToUpdate = req.body.branchToUpdate.replace(/\s/g,'-');
    branchName = req.body.branchName.replace(/\s/g,'-');
    upstream_branch = 'origin/master';
    url = `http://localhost:7005/projects/bare/${projName}.git`;

    timestamp = Date.now();

    barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git'); 
    workdirpath = path.resolve(__dirname, '..', 'projects', branchToUpdate, projName, username+timestamp);

    try{
        await preRouteChecks(curr_majorHash, projName, username, timestamp, branchToUpdate)
        let response = await main(projName, workdirpath, curr_majorHash)
        res.status(200).send(response);
    }catch(e){
        res.status(400).send(`main caller err: ${e}`);
    }
})

function main(projName, workdirpath, curr_majorHash){
    return new Promise ( async (resolve, reject) => {
        try {
            let newBranchNamePath = await gitBranchAdd(workdirpath, branchName)
            await createAndMoveWorkDir(workdirpath,newBranchNamePath)
            await setUpstream(workdirpath, upstream_branch);
            const files = await gitListFiles(workdirpath);
            const responseobj = await pushChecker(projName, username, branchToUpdate, curr_majorHash); 
            console.log("pushchecker returned this: \n", responseobj);
            resolve({
                projName: projName, 
                majorHash: responseobj.ipfsHash, 
                statusLine: responseobj.statusLine, 
                mergeArr: responseobj.mergeArr, 
                url: url,
                files: files
            });
        } catch(e) {
            reject(`main err: ${e}`);
        }
    })
}

function createAndMoveWorkDir(workdirpath,newBranchNamePath) {
    return new Promise( async (resolve, reject) => {
        try {
            fs.mkdir(newBranchNamePath, (err) => {
                if (err) reject(`could not create new Branch name folder ${err}`);
                fs.
            })
        }
    })
}
function gitBranchAdd(workdirpath, branchName) {
    return new Promise (async (resolve, reject) => {
        let newBranchNamePath = "";
        try {
            await git.branch({
                dir: workdirpath,
                ref: branchName,
                checkout: true
            })
            branchToUpdate = branchName;
            newBranchNamePath = path.resolve(__dirname, '..', 'projects', projName, branchToUpdate);
            resolve(newBranchNamePath);
        } catch(e) {
            reject(`git-branch err: ${e}`);
        }
    })
}



function setUpstream(workdirpath, upstream_branch) {
    return new Promise(async (resolve, reject) => {
        try {
            exec(`git branch --set-upstream-to=${upstream_branch}`, {
                cwd: workdirpath,
                shell: true
            }, (err, stdout, stderr) => {
                if (err) reject(`git-setupstream err: ${err}`);
                if (stderr) reject(`git-setupstream stderr: ${stderr}`);
                console.log(stdout);
            })
            resolve(true);
        } catch(e) {
            reject(`git-branch-setUpstream err: ${e}`)
        } 
    })
}

function gitListFiles(workdirpath) {
    let command = `FILES="$(git ls-tree --name-only HEAD .)";IFS="$(printf "\n\b")";for f in $FILES; do    str="$(git log -1 --pretty=format:"%s%x28%x7c%x29%x2D%x7c%x2D%x28%x7c%x29%cr" $f)";  printf "%s(|)-|-(|)%s\n" "$f" "$str"; done`;
    return new Promise (async (resolve, reject) => {
        try {
            exec(command, {
                cwd: workdirpath,
                shell: true
            }, (err,stdout,stderr) => {
                if(err) { console.log('err: '+err); reject(`git-ls-tree cli err: ${err}`);}
                //if(stderr) {console.log('stderr: '+stderr);reject(`git-ls-tree cli stderr: ${stderr}`);}
                
                /**
                 * 1. Convert stdout to string array
                 * 2. Split by '(|)-|-(|)' seperator. Had to decide upon a weirdest symbol - my imaginations are helpful with this. Thanks lenny face.
                 * 3. create an object and pass it out of this function in resolve().
                 */
                files = [];
                stdout.trim().split('\n').forEach( output_arr => {
                    let file = output_arr.split('(|)-|-(|)')[0];
                    let commitmsg = output_arr.split('(|)-|-(|)')[1];
                    let time = output_arr.split('(|)-|-(|)')[2];
                    let obj = { file: file, commitmsg: commitmsg, time: time}
                    //console.log(obj);
                    files.push(obj);
                })
                resolve(files);
            })
        }catch(e){
            reject(`git-ls-tree err: ${e}`);
        }
    })
}

module.exports = router;
