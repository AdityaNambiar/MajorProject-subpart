/**
 * Return a list of branches from the current working git repo
 * (No changes in .git/ folder - confirmed)
 */

// Misc:
const addToIPFS = require('../utilities/addToIPFS');
const preRouteChecks = require('../utilities/preRouteChecks');
const removeFromIPFS = require('../utilities/removeFromIPFS');
const statusChecker = require('../utilities/statusChecker');
const pushChecker = require('../utilities/pushChecker');
const pushToBare = require('../utilities/pushToBare');
const rmWorkdir = require('../utilities/rmWorkdir');

// isomorphic-git related imports and setup
const fs = require('fs');
const git = require('isomorphic-git'); 

const path = require('path');
const express = require('express');
const router = express.Router();

var projName, workdirpath, curr_majorHash, 
    username, branchToUpdate, majorHash, 
    barerepopath, filenamearr, statusLine,
    branchlist=[];

router.post('/getBranches', async (req,res) => {
    projName = req.body.projName.replace(/\s/g,'-');
    username = req.body.username.replace(/\s/g,'-');
    curr_majorHash = req.body.majorHash;  // latest
    branchToUpdate = req.body.branchToUpdate.replace(/\s/g,'-');

    barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git'); 
    workdirpath = path.resolve(__dirname, '..', 'projects', projName, username);

    try{
        await preRouteChecks(curr_majorHash, projName, username, branchToUpdate)
        .then( async () => {
            let response = await main(projName, workdirpath, curr_majorHash)
            return response;
        })
        .then ( (response) => {
            res.status(200).send(response);
        })
    }catch(e){
        res.status(400).send(`main caller err: ${e}`);
    }
});

async function main(projName, workdirpath, curr_majorHash){ 
    return new Promise ( async (resolve, reject) => {
        try {
            await gitListBranches(workdirpath)
            .then ( async (bList) => {
                branchlist = bList
                statusLine = await statusChecker(projName, username);
                return statusLine;
            })
            .then( async () => {
                filenamearr = [];
                filenamearr = await pushChecker(projName, username, branchToUpdate); 
                console.log("pushchecker returned this: \n", filenamearr);
            })
            if (filenamearr.length == 0) {  // if no conflicts only then proceed with cleaning up.
                console.log(`Pushing to branch: ${branchToUpdate}`);
                await pushToBare(projName, branchToUpdate, username)
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
                    console.log("MajorHash (git getBranches): ", majorHash);
                    resolve({projName: projName, majorHash: majorHash, filenamearr: filenamearr, branchlist: branchlist, statusLine: statusLine});
                })
            } else if (filenamearr[0] != "Please solve this merge conflict via CLI"){
                resolve({projName: projName, majorHash: majorHash, filenamearr: filenamearr, branchlist: branchlist, statusLine: statusLine});
            } else {
                resolve({projName: projName, majorHash: curr_majorHash, filenamearr: filenamearr, branchlist: branchlist, statusLine: statusLine});
            }
        } catch (e) {
            reject(`main err: ${e}`);
        }
    })
}

async function gitListBranches(workdirpath) {
    return new Promise (async (resolve, reject) => {
        try {
            let remoteBranches = await git.listBranches({
                dir: workdirpath,
                remote: 'origin'
            })
            let localBranches = await git.listBranches({
                dir: workdirpath
            })
            branchlist = localBranches.concat(remoteBranches);
            branchlist = branchlist.filter( branchname => branchname != "HEAD")
            branchlist = branchlist.filter( (v, i, a) => a.indexOf(v) === i ); // Removing duplicates - credits - https://stackoverflow.com/a/14438954
            resolve(branchlist);
        } catch(e) {
            reject(`git-list-branch err: ${e}`);
        }
    })
}
module.exports = router;
