/**
 * Return a list of branches from the current working git repo
 * (No changes in .git/ folder - confirmed)
 */

// Misc:
const addToIPFS = require('../utilities/addToIPFS');
const preRouteChecks = require('../utilities/preRouteChecks');
const removeFromIPFS = require('../utilities/removeFromIPFS');
const pushChecker = require('../utilities/pushChecker');
const pushToBare = require('../utilities/pushToBare');
const rmWorkdir = require('../utilities/rmWorkdir');

// isomorphic-git related imports and setup
const fs = require('fs');
const git = require('isomorphic-git');
git.plugins.set('fs',fs); // Bring your own file system 

const path = require('path');
const express = require('express');
const router = express.Router();

var projName, branchName, workdirpath, 
    curr_majorHash, username;
// vars used as global:
var branchToUpdate, branchlist=[], barerepopath,
    filenamearr;

router.post('/getBranches', async (req,res) => {
    projName = req.body.projName.replace(/\s/g,'-');
    branchName = req.body.branchName.replace(/\s/g,'-');
    username = req.body.username.replace(/\s/g,'-');
    curr_majorHash = req.body.majorHash;  // latest
    branchToUpdate = req.body.branchToUpdate;

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
        await gitListBranches(workdirpath)
        .then( async (branches) => {
            branchlist = branches;
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
            console.log("MajorHash (git getBranches): ", majorHash);
            console.log(` branches: ${branchlist}`);
            resolve({projName: projName, majorHash: majorHash,
                     branchlist: branchlist, filenamearr: filenamearr});
        })
        .catch((e) => {
            reject(`main err: ${e}`);
        })
    })
}

async function gitListBranches(workdirpath) {
    return new Promise (async (resolve, reject) => {
        try {
            let branches = await git.listBranches({
                dir: workdirpath
            })
            console.log("branches in func: "+branches);
            resolve(branches);
        } catch(e) {
            reject(`git-list-branch err: ${e}`);
        }
    })
}
module.exports = router;
