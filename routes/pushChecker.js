/**
*  - Check between bare repo status and username work dir status
*  - Called when the Merge Conflict page is loaded. (componentDidMount)
*  - Utility.
*      - `git pull barerepo master`
*      - if conflicts arise, { do the same that you did for mergeFiles route when conflicts arise }.
*      - if conflicts dont arise, pull will be successful.
*/

// Misc:
const addToIPFS = require('../utilities/addToIPFS');
const preRouteChecks = require('../utilities/preRouteChecks');
const removeFromIPFS = require('../utilities/removeFromIPFS');
const rmWorkdir = require('../utilities/rmWorkdir');

// Terminal execution:
const { exec } = require('child_process');

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


router.post('/pushChecker', async (req,res) => {
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
});

async function main(projName, workdirpath, curr_majorHash, username){
    return new Promise ( async (resolve, reject) => {
        gitPull(workdirpath, branchName)
        .then( async () => {
            console.log(`Push to branch: ${branchToUpdate}`);
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

async function gitPull(workdirpath) {
    return new Promise( async (resolve, reject) => {
        try {
            await exec(`git pull origin master`, {
                cwd: workdirpath,
                shell: true
            }, (err, stdout, stderr) => {
                if (err) {
                    reject(`(pushchecker) git-pull cli err: ${err}`);
                }
                if (stderr) {
                    reject(`(pushchecker) git-pull cli stderr: ${stderr}`);
                }
                console.log(stdout);
                resolve(stdout);
            })
        } catch(e) {
            reject(`(pushchecker) git-pull err: ${e}`)
        }
    })
}
module.exports = router