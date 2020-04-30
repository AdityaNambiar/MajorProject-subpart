/**
 * Remove a branch from the current working git repo
 */

// Misc:
const addToIPFS = require('../utilities/addToIPFS');
const preRouteChecks = require('../utilities/preRouteChecks');
const removeFromIPFS = require('../utilities/removeFromIPFS');
const statusChecker = require('../utilities/statusChecker');
const pushChecker = require('../utilities/pushChecker');
const pushToBare = require('../utilities/pushToBare');
const rmWorkdir = require('../utilities/rmWorkdir');

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
var branchToUpdate, barerepopath, 
    workdirpath, filenamearr;


var projName, workdirpath, curr_majorHash, 
    username, branchToUpdate, majorHash, 
    barerepopath, filenamearr = [], statusLine,
    branchName;

router.post('/deleteBranch', async (req,res) => {
    projName = req.body.projName.replace(/\s/g,'-');
    branchToUpdate = req.body.branchToUpdate.replace(/\s/g,'-');
    curr_majorHash = req.body.majorHash; // latest
    username = req.body.username.replace(/\s/g,'-');
    branchName = req.body.branchName.replace(/\s/g,'-');

    barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git'); 
    workdirpath = path.resolve(__dirname, '..', 'projects', projName, username);

    try{
        await preRouteChecks(curr_majorHash, projName, username, branchToUpdate)
        .then( async () => {
            let response = await main()
            return response;
        })
        .then ( (response) => {
            res.status(200).send(response); 
        })
    }catch(e){
        res.status(400).send(`main caller err: ${e}`);
    }
})

async function main() {
    return new Promise ( async (resolve, reject) => {
        try {
            await gitDeleteBranch(workdirpath, branchName)
            .then ( async () => {
                statusLine = await statusChecker(projName, username);
                return statusLine;
            })
            .then( async () => {
                filenamearr = [];
                filenamearr = await pushChecker(projName, username, branchToUpdate); 
                console.log("pushchecker returned this: \n", filenamearr);
            })
            if (filenamearr.length == 0) {  // if no conflicts only then proceed with cleaning up.
                console.log(`Push (with --delete) to branch: ${branchName}`);
                await deleteBranchAtBare(branchName)
                // Essentially does a git push but with `--delete` to remove the remote tracking branch from bare.
                // Exclusive to this route only.
                .then( async () => {
                    await rmWorkdir(projName, username);
                })
                .then( async () => {
                    // Remove old state from IPFS.
                    await removeFromIPFS(curr_majorHash);
                })
                .then( async () => {
                    // Add new state to IPFS.
                    majorHash = await addToIPFS(barerepopath);
                    return majorHash;
                })
                .then( (majorHash) => {
                    console.log("MajorHash (git deleteBranch): ", majorHash);
                    resolve({projName: projName, majorHash: majorHash, filenamearr: filenamearr, statusLine: statusLine});
                })
            } else if (filenamearr[0] != "Please solve this merge conflict via CLI"){
                resolve({projName: projName, majorHash: majorHash, filenamearr: filenamearr, statusLine: statusLine});
            } else {
                resolve({projName: projName, majorHash: curr_majorHash, filenamearr: filenamearr, statusLine: statusLine});
            }
        } catch (e) {
            reject(`main err: ${e}`);
        }
    })
}

async function gitDeleteBranch(workdirpath, branchName){
    console.log("branch name to delete: ", branchName);
    return new Promise( async (resolve, reject) => {
        try {
            await git.deleteBranch({
                dir:  workdirpath,
                ref: branchName,
            })
            resolve(true);
        }catch(e){
            if (e.name == "RefNotExistsError"){
                resolve(true);
            } else {
                reject("deleteBranch git ERR: "+e)
            }
        }
    })
}

async function deleteBranchAtBare(branchName) {
    console.log(`git push --delete ${barerepopath} ${branchName}`);
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