/**
 * Add a new branch in git repo:
 */
// Misc:
const addToIPFS = require('../utilities/addToIPFS');
const preRouteChecks = require('../utilities/preRouteChecks');
const removeFromIPFS = require('../utilities/removeFromIPFS');
const pushToBare = require('../utilities/pushToBare');

const { exec } = require('child_process');

// isomorphic-git related imports and setup
const fs = require('fs');
const git = require('isomorphic-git');
git.plugins.set('fs',fs); // Bring your own file system 

const path = require('path');
const express = require('express');
const router = express.Router();


var workdirpath, barerepopath, curr_majorHash, username,
    branchToUpdate, upstream_branch;


router.post('/addBranch', async (req,res) => {
    projName = req.body.projName.replace(/\s/g,'-') || 'app';
    branchName = req.body.name.replace(/\s/g,'-') || 'f1';
    username = req.body.username.replace(/\s/g,'-') || 'Aditya';
    curr_majorHash = 'Qmeo4e37qoXprbVqCzkRRWAHkfP3uzfJnVs5kotYE6Mife';  // latest
    branchToUpdate = 'master';
    upstream_branch = 'origin/master';

    barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git'); 
    workdirpath = path.resolve(__dirname, '..', 'projects', projName, username);

    try{
        await preRouteChecks(curr_majorHash, projName, username)
        .then( async () => {
            await main(projName, workdirpath, branchName, curr_majorHash, branchToUpdate, upstream_branch)
        })
        .then ( (response) => {
            res.status(200).send(response);
        })
    }catch(e){
        res.status(400).send(`main err: ${e}`);
    }
})

async function main(projName, workdirpath, branchName, curr_majorHash, branchToUpdate, upstream_branch){
    return new Promise ( async (resolve, reject) => {
        gitBranchAdd(workdirpath, branchName)
        .then( async () => {
            await setUpstream(workdirpath, upstream_branch);
        })
        .then( async () => {
            // 'files' arr should be filled up.
            var files = await gitListFiles(workdirpath);
            return files; // Propagate further down the "then() chain" for last then to access and resolve.
        })
        .then( async (files) => {
            await pushToBare(projName, branchToUpdate);
            return files;
        })
        .then( async (files) => {
            // Remove old state from IPFS.
            await removeFromIPFS(curr_majorHash, projName);
            return files;
        })
        .then( async (files) => {
            // Add new state to IPFS.
            var majorHash = await addToIPFS(barerepopath);
            console.log("MajorHash (git init): ", majorHash);
            resolve({projName: projName, majorHash: majorHash, files: files});
        })
        .catch((e) => {
            reject(`main err: ${e}`);
        })
    })
}

async function gitBranchAdd(workdirpath, branchName) {
    return new Promise (async (resolve, reject) => {
        try {
            await git.branch({
                dir:  workdirpath,
                ref: branchName,
                checkout: true
            })
            resolve(true);
        } catch(e) {
            reject(`git-branch err: ${e}`);
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
async function gitListFiles(workdirpath, branchName) {
    return new Promise (async (resolve, reject) => {
        try {
            files = await git.listFiles({
                dir:  workdirpath,
                ref:  branchName
            })
            resolve(files);
        }catch(e){
            // For situations when user wants to list files at a commit hash:
            if (e.name == 'ResolveRefError'){
                await exec('git ls-files', {
                    cwd: workdirpath,
                    shell: true,
                }, async (err, stdout, stderr) => {
                    if (err) {
                        reject("getFiles cli err: "+err); 
                    }
                    if (stderr) {
                        reject("getFiles cli stderr: "+stderr);
                    }
                    if(stdout){
                        console.log("getFiles cli : \n", stdout);
                        filesarr = []
                        filesarr = stdout.trim().split("\n");
                        resolve(filesarr);
                    }
                })
            } else {
                reject(`git-ls-files err: ${e}`);
            }
        }
    })
}

module.exports = router;
/*
async function gitBranchCheckout(workdirpath, branchName) {
    return new Promise (async (resolve, reject) => {
        try {
            await git.checkout({
                dir:  workdirpath,
                ref: branchName,
            });
            resolve(true);
        } catch(e) {
            reject(`git-checkout-cli err: ${e}`)
        }
    })
}
*/
