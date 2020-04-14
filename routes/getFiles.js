
/**
 * Get (Read) list of files in current branch of git repository.
 * (No changes in .git/ folder - confirmed)
 */

// Misc:
const addToIPFS = require('../utilities/addToIPFS');
const preRouteChecks = require('../utilities/preRouteChecks');
const removeFromIPFS = require('../utilities/removeFromIPFS');
const pushToBare = require('../utilities/pushToBare');
const pushChecker = require('../utilities/pushChecker');
const statusChecker = require('../utilities/statusChecker');
const rmWorkdir = require('../utilities/rmWorkdir');

// Terminal execution import
const { exec } = require('child_process');

// isomorphic-git related imports and setup
const fs = require('fs');
const git = require('isomorphic-git');
git.plugins.set('fs',fs); // Bring your own file system 

const path = require('path');
const express = require('express');
const router = express.Router();

var projName, branchName, 
    curr_majorHash, username;
// vars used as global:
var branchToUpdate, files = [], 
    barerepopath, workdirpath, upstream_branch,
    filenamearr, statusLine;

router.post('/getFiles', async (req,res) => {
    projName = req.body.projName;
    curr_majorHash = req.body.majorHash; // hard coded
    branchName = req.body.name;
    branchToUpdate = req.body.branchToUpdate;
    username = req.body.username;
    upstream_branch = 'origin/master';

    barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git'); 
    workdirpath = path.resolve(__dirname, '..', 'projects', projName, username);

    try{
        await preRouteChecks(curr_majorHash, projName, username, branchToUpdate)
        .then( async () => {
            let response = await main(projName, curr_majorHash, branchName)
            return response;
        })
        .then ( (response) => {
            res.status(200).send(response);
        })
    }catch(e){
        res.status(400).send(`main caller err: ${e}`);
    }
})

async function main(projName, curr_majorHash){
    return new Promise ( async (resolve, reject) => {
        await gitCheckout(workdirpath)
        .then( async () => {
            await setUpstream(workdirpath, upstream_branch);
        })
        .then ( async () => {
            statusLine = await statusChecker()
            return statusLine;
        })
        .then( async () => {
            files = await gitListFiles(workdirpath)
        })
        .then( async () => {
            filenamearr = await pushChecker(projName, username);
        })
        .then( async () => {
            console.log(`Pushing to branch: ${branchToUpdate}`);
            await pushToBare(projName, branchToUpdate, username);
        })
        .then( async () => {
            await rmWorkdir(projName, username);
        })
        .then( async () => {
            // Remove old state from IPFS.
            await removeFromIPFS(curr_majorHash, projName);
        })
        .then( async () => {
            // Add new state to IPFS.
            let majorHash = await addToIPFS(barerepopath);
            return majorHash;
        })
        .then( (majorHash) => {
            console.log("MajorHash (git getFiles): ", majorHash);
            console.log(` Files: ${files}`);
            resolve({projName: projName, majorHash: majorHash, 
                     files: files, filenamearr: filenamearr});
        })
        .catch((e) => {
            reject(`main err: ${e}`);
        })
    })
}

async function gitCheckout(workdirpath){
    return new Promise (async (resolve, reject) => {
        try {
            exec(`git checkout ${branchToUpdate}`, {
                cwd: workdirpath,
                shell: true
            }, (err,stdout,stderr) => {
                if(err) { console.log('err: '+err); reject(`git-ls-tree cli err: ${err}`);}
                //if(stderr) {console.log('stderr: '+stderr);reject(`git-ls-tree cli stderr: ${stderr}`);}
                resolve(true);
            })
        }catch(e){
            reject(`git-checkout err: ${e}`);
        }
    })
}

async function setUpstream(workdirpath, upstream_branch) {
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

async function gitListFiles(workdirpath) {
    let command = `FILES="$(git ls-tree --name-only HEAD .)";IFS="$(printf "\n\b")";for f in $FILES; do    str="$(git log -1 --pretty=format:"%s%x2D%cr" $f)";  printf "%s-%s\n" "$f" "$str"; done`;
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
                 * 2. Split by '-' seperator.
                 * 3. create an object and pass it out of this function in resolve().
                 */
                files = [];
                stdout.trim().split('\n').forEach( output_arr => {
                    let file = output_arr.split('-')[0];
                    let commitmsg = output_arr.split('-')[1];
                    let time = output_arr.split('-')[2];
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