/**
 * Remove a branch from the current working git repo
 */

// Misc:
const preRouteChecks = require('../utilities/preRouteChecks');
const pushChecker = require('../utilities/pushChecker');

const { exec } = require('child_process');

// isomorphic-git related imports and setup
const fs = require('fs-extra');
const git = require('isomorphic-git'); 

const path = require('path');
const express = require('express');
const router = express.Router();

router.post('/deleteBranch', async (req,res) => {
    var projName = req.body.projName;
    var username = req.body.username;
    var curr_majorHash = req.body.majorHash;  // latest
    var branchToUpdate = req.body.branchToUpdate;
    var branchName = req.body.branchName;
    var url = `'http://localhost:7005/projects/bare/${projName}.git'`;

    var timestamp = Date.now();

    var barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git');
    var branchPathToRemove = path.resolve(__dirname, '..', 'projects', projName, branchName); 
    var workdirpath = path.resolve(__dirname, '..', 'projects', projName, branchToUpdate, username+timestamp);

    try{
        await preRouteChecks(curr_majorHash, projName, username, timestamp, branchToUpdate)
        let response = await main(projName, timestamp, barerepopath, workdirpath, branchPathToRemove, curr_majorHash, branchName, url)
        res.status(200).send(response);
    }catch(err){
        console.log(err);
        res.status(400).send(`deleteBranch err ${err.name} :- ${err.message}`);
    }
})


async function main(projName, timestamp, barerepopath, workdirpath, branchPathToRemove, curr_majorHash, branchName, url){
    try {
        await gitDeleteBranch(workdirpath, branchName)
        const responseobj = await pushChecker(barerepopath, workdirpath, timestamp, curr_majorHash, null, true, branchName)
        // .catch( async (err) => {
        //     console.log(err);
        //     await rmWorkdir(workdirpath); // Remove the workdir folder from old branchNamePath
        //     reject(new Error(`(pushChecker) err ${err.name} :- ${err.message}`)); 
        // }); 
        console.log("pushchecker returned this: \n", responseobj);
        await removeBranchPath(branchPathToRemove) // removes branchName dir of the old branch name
        return ({
            projName: projName, 
            majorHash: responseobj.ipfsHash, 
            statusLine: responseobj.statusLine, 
            mergeObj: responseobj.mergeObj, 
            url: url
        });
    } catch(err) {
        console.log(err);
        //await rmWorkdir(workdirpath);
        throw new Error(`(deleteBranch) main err ${err.name} :- ${err.message}`);
    }
}

function removeBranchPath(branchPathToRemove) {
    return new Promise((resolve, reject) => {
        try {
            fs.remove(branchPathToRemove, (err) => {
                if (err) { 
                    console.log(err);
                    reject(new Error(`(deleteBranch) fs.remove err ${err.name} :- ${err.message}`));
                }
                resolve(true)
            })
        } catch (err) {
            console.log(err);
            reject(new Error(`(deleteBranch) removeBranchPath err ${err.name} :- ${err.message}`));
        }
    })
}
async function gitDeleteBranch(workdirpath, branchName){
    try {
        await git.deleteBranch({
            fs: fs,
            dir:  workdirpath,
            ref: branchName,
        })
        return(true);
    }catch(err){
        if (err.name == "NotFoundError"){ 
            /**
             * 1. We don't have two branches available at the same time. 
             *    Even to do so, its difficult because the route has to checkout this 
             *    'existing' branch first to make it available.
             * 2. So isomorphic-git will give this error which can be handled by allowing 
             *    the route to later delete the branch at remote.
             *  
            */ 
           return(true);
        } else {
            throw new Error(`deleteBranch git err ${err.name} :- ${err.message}`)
        }
    }
}

module.exports = router;