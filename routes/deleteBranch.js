/**
 * Remove a branch from the current working git repo
 */

// Misc:
const preRouteChecks = require('../utilities/preRouteChecks');
const pushChecker = require('../utilities/pushChecker');
const cleanUp = require('../utilities/cleanUp');
const addToIPFS = require('../utilities/addToIPFS');
const pushToBare = require('../utilities/pushToBare');


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

    var timestamp = "(|)-|-(|)" + Date.now();

    var barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git');
    var branchPathToRemove = path.resolve(__dirname, '..', 'projects', projName, branchName); 
    var workdirpath = path.resolve(__dirname, '..', 'projects', projName, branchToUpdate, username+timestamp);

    try{
        await preRouteChecks(curr_majorHash, projName, username, timestamp, branchToUpdate)
        let response = await main(projName, username, timestamp, branchToUpdate, barerepopath, workdirpath, branchPathToRemove, curr_majorHash, branchName, url)
        res.status(200).send(response);
    }catch(err){
        console.log(err);
        res.status(400).send(`deleteBranch err ${err.name} :- ${err.message}`);
    }
})


async function main(projName, username, timestamp, branchToUpdate, barerepopath, workdirpath, branchPathToRemove, curr_majorHash, branchName, url){
    try {
        await gitDeleteBranch(workdirpath, branchName)
        const responseobj = await pushChecker(projName, username, timestamp, branchToUpdate, barerepopath, workdirpath, curr_majorHash, null, true, branchName)
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
        let checkExistBranch = await gitListBranches(workdirpath, branchName)
        if (!checkExistBranch){
            await gitBranchAdd(barerepopath, workdirpath, branchName);
            await pushToBare(barerepopath, workdirpath, branchName);    
        }
        await addToIPFS(barerepopath);
        await cleanUp(workdirpath, err.message);
        throw new Error(`(deleteBranch) main err ${err.name} :- ${err.message}`);
    }
}
async function gitBranchAdd(workdirpath, branchName) {
    try {
        await git.branch({
            fs: fs,
            dir: workdirpath,
            ref: branchName,
            checkout: true
        })
        return(true);
    } catch(err) {
        console.log(err); 
        throw new Error(`git-branch err ${err.name} :- ${err.message}`);
    }
}
async function gitListBranches(workdirpath, branchName) {
    // I have to bring in remote branch names as well as local branch names (removing "HEAD" from this because isomorphic returns this for local)
    try {
        var branchlist = [];
        let remoteBranches = await git.listBranches({
            fs: fs,
            dir: workdirpath,
            remote: 'origin'
        })
        let localBranches = await git.listBranches({
            fs:fs,
            dir: workdirpath
        })
        branchlist = localBranches.concat(remoteBranches);
        branchlist = branchlist.filter(branchname => branchname != "HEAD")
        branchlist = branchlist.filter((v, i, a) => a.indexOf(v) === i); // Removing duplicates - credits - https://stackoverflow.com/a/14438954
        if (branchlist.includes(branchName))
            return true
        else 
            return false 
    } catch (err) {
        console.log(err);
        throw new Error(`(gitListBranches) git-list-branch err ${err.name} :- ${err.message}`);
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
        let checkExistBranch = await gitListBranches(workdirpath, branchName);
        if (checkExistBranch){
            await git.deleteBranch({
                fs: fs,
                dir:  workdirpath,
                ref: branchName,
            })
        }
    }catch(err){
        if (err.name == "NotFoundError"){ 
            await git.deleteRef({ fs: fs, dir: workdirpath, ref: `refs/origin/${branchName}` })
           return(true);
        } else {
            throw new Error(`deleteBranch git err ${err.name} :- ${err.message}`)
        }
    }
}

module.exports = router;