/**
 * Remove a branch from the current working git repo
 */

// Misc:
const addToIPFS = require('../utilities/addToIPFS');
const preRouteChecks = require('../utilities/preRouteChecks');
const removeFromIPFS = require('../utilities/removeFromIPFS');
const rmWorkdir = require('../utilities/rmWorkdir');

// isomorphic-git related imports and setup
const fs = require('fs');
const git = require('isomorphic-git');
git.plugins.set('fs',fs); // Bring your own file system 

const path = require('path');
const express = require('express');
const router = express.Router();

var projName, curr_majorHash, username,
    branchName;
// vars used as global:
var branchToUpdate, barerepopath, workdirpath;

router.post('/deleteBranch', async (req,res) => {
    projName = req.body.projName;
    branchToUpdate = req.body.branchToUpdate;
    curr_majorHash = req.body.majorHash; // latest
    branchName = req.body.branchName;

    barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git'); 
    workdirpath = path.resolve(__dirname, '..', 'projects', projName, username);

    try{
        await preRouteChecks(curr_majorHash, projName, username, branchToUpdate)
        .then( async () => {
            let response = await main(projName, workdirpath, curr_majorHash, branchName)
            return response;
        })
        .then ( (response) => {
            res.status(200).send(response);
        })
    }catch(e){
        res.status(400).send(`main caller err: ${e}`);
    }
})
async function main(projName, workdirpath, curr_majorHash, branchName) {
    return new Promise ( async (resolve, reject) => {
        gitDeleteBranch(workdirpath, branchName)
        .then( async () => {
            console.log(`Push (with --delete) to branch: ${branchToUpdate}`);
            await deleteBranchAtBare(projName, branchToUpdate, username); 
            // Essentially does a git push but with `--delete` to remove the remote tracking branch from bare.
            // Exclusive to this route only.
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
            console.log("MajorHash (git addBranch): ", majorHash);
            console.log(` Files: ${files}`);
            resolve({projName: projName, majorHash: majorHash, files: files});
        })
        .catch((e) => {
            reject(`main err: ${e}`);
        })
    })
}

async function gitDeleteBranch(workdirpath, branchName){
    return new Promise( async (resolve, reject) => {
        try {
            await git.deleteBranch({
                dir:  workdirpath,
                ref: branchName
            })
        }catch(e){
            console.log("deleteBranch git ERR: ",e);
            res.status(400).send(e);
        }
    })
}

async function deleteBranchAtBare(projName, branchName, username) {

    barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git'); 
    workdirpath = path.resolve(__dirname, '..', 'projects', projName, username);

    return new Promise( async (resolve, reject) => {
        await exec(`git push --delete ${barerepopath} ${branchName} `, {
            cwd: workdirpath,
            shell: true
        }, (err, stdout, stderr) => {
            if (err) reject(`git push cli err: ${err}`) 
            //if (stderr) reject(`git push cli stderr: ${stderr}`) 
            console.log('git push cli stdout: ',stdout)
            resolve(true);
        })
        
    })
}
module.exports = router;