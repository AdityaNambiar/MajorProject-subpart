/**
 * A route that just calls removeFromIPFS().
 */

 // Misc:
const preRouteChecks = require('../utilities/preRouteChecks');
const removeFromIPFS = require('../utilities/removeFromIPFS');

// isomorphic-git related imports and setup
const fs = require('fs');

const path = require('path');
const express = require('express');
const router = express.Router();

var workdirpath, barerepopath, projNamepath, 
    majorHash, username;


router.post('/deleteProj', async (req,res) => {
    projName = req.body.projName || 'app';
    branchName = req.body.name || 'master';
    username = req.body.username || 'Aditya';
    branchToUpdate = req.body.branchToUpdate || 'master';
    majorHash = 'QmNPHq5eQaZvB3pDjxLy2r5se9m17bFw2omtmuwYNnAmqq';  // latest

    workdirpath = path.resolve(__dirname, '..', 'projects', projName, username);
    barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git'); 
    projNamepath = path.resolve(__dirname, '..', 'projects', projName);
    
    try{
        await preRouteChecks(majorHash, projName, username)
        .then( async () => {
            await main(projLeader,projName,branchName,majorHash,)
        })
        .then( (response) => {
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
            resolve({projName: projName, majorHash: majorHash});
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
