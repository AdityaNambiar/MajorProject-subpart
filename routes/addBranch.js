/**
 * Add a new branch in git repo:
 */
// Misc:
const addToIPFS = require('../utilities/addToIPFS');
const preRouteChecks = require('../utilities/preRouteChecks');
const removeFromIPFS = require('../utilities/removeFromIPFS');
const pushToBare = require('../utilities/pushToBare');

// isomorphic-git related imports and setup
const fs = require('fs');
const git = require('isomorphic-git');
git.plugins.set('fs',fs); // Bring your own file system 

const path = require('path');
const express = require('express');
const router = express.Router();

var workdirpath, barerepopath, projectspath, majorHash, 
    files, filesarr, username;


router.post('/addBranch', async (req,res) => {
    projName = req.body.projName || 'app';
    branchName = req.body.name || 'master';
    username = req.body.username || 'Aditya';
    majorHash = 'QmNPHq5eQaZvB3pDjxLy2r5se9m17bFw2omtmuwYNnAmqq';  // latest

    barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git'); 
    workdirpath = path.resolve(__dirname, '..', 'projects', projName, username);

    try{
        await preRouteChecks(majorHash, projName, username)
        .then( async () => {
            await main(projLeader, projName, branchName, majorHash, res)
        })
        .then ( (response) => {
            res.status(200).send(response);
        })
    }catch(e){
        res.status(400).send(`main err: ${e}`);
    }
})

async function main(projName, workdirpath, branchName, majorHash, res){
    return new Promise ( async (resolve, reject) => {
        gitBranchAdd(workdirpath, branchName)
        .then( async () => {
            await gitBranchCheckout(workdirpath, branchName);
        })
        .then( async () => {
            // 'files' arr should be filled up.
            files = await gitListFiles(workdirpath);
        })
        .then( async () => {
            await pushToBare(projName, branchToUpdate);
        })
        .then( async () => {
            // Remove old state from IPFS.
            await removeFromIPFS(majorHash, projName);
        })
        .then( async () => {
            // Add new state to IPFS.
            majorHash = await addToIPFS(barerepopath);
            console.log("MajorHash (git init): ", majorHash);
            resolve({projName: projName, majorHash: majorHash, files: files});
            //res.status(200).send({projName: projName, majorHash: majorHash, files: files});
        })
        .catch((e) => {
            reject(`main err: ${e}`);
        })
    })
    try {
    // Git work:
    
    var oldmajorHash = majorHash;
    // Store new state of git repo:
    majorHash = await addToIPFS(projName+'.git');
    // Prevent cluttering IPFS repo by unpinning old states of repo:
    await removeFromIPFS(oldmajorHash, projLeader, projName);
    console.log("Updated MajorHash (git branch newbranch): ",majorHash);
    
    } catch(e) {
        console.log("(git branch newbranch) err: ",e);
        res.status(400).send(e);
    } 
}

async function gitBranchAdd(workdirpath, branchName) {
    return new Promise (async (resolve, reject) => {
        try {
            await git.branch({
                dir:  workdirpath,
                ref: branchName
            })
            resolve(true);
        } catch(e) {
            reject(`git-branch err: ${e}`);
        }
    })
}

async function gitBranchCheckout(workdirpath, branchName) {
    return new Promise (async (resolve, reject) => {
        try {
            await git.checkout({
                dir:  workdirpath,
                ref: branchName,
            });
            resolve(true);
        } catch(e) {
            // For situations when user wants to checkout to a commit hash:
            if (e.name == 'ResolveRefError'){
                await exec('git checkout '+branchName, {
                    cwd: workdirpath,
                    shell: true,
                }, async (err, stdout, stderr) => {
                    if (err) {
                        reject("checkoutBranch cli err: "+err); 
                    }
                    if (stderr) {
                        console.log("checkoutBranch cli stderr: "+stderr);
                    }
                    resolve(true);
                })
            } else {
                reject(`git-checkout-cli err: ${e}`)
            }
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