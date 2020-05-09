
/**
 * Get (Read) list of files in current branch of git repository.
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

// Terminal execution import
const { exec } = require('child_process');

// isomorphic-git related imports and setup
const fs = require('fs');
const git = require('isomorphic-git'); 

const path = require('path');
const express = require('express');
const router = express.Router();

router.post('/checkoutBranch', async (req,res) => {
    var projName = req.body.projName;
    var username = req.body.username;
    var curr_majorHash = req.body.majorHash;  // latest
    var branchToUpdate = req.body.branchToUpdate;
    var upstream_branch = 'origin/master';
    var url = `'http://localhost:7005/projects/bare/${projName}.git'`;

    var timestamp = "(|)-|-(|)" + Date.now();

    var barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git'); 
    var workdirpath = path.resolve(__dirname, '..', 'projects', projName, branchToUpdate, username+timestamp);

    try{
        await preRouteChecks(curr_majorHash, projName, username, timestamp, branchToUpdate)
        let response = await main(projName, username, timestamp, barerepopath, workdirpath, branchToUpdate, curr_majorHash, upstream_branch, url)
        res.status(200).send(response);
    }catch(err){
        console.log(err);
        res.status(400).send(`(checkoutBranch) err ${err.name} :- ${err.message}`);
    }
})

async function main(projName, username, timestamp, barerepopath, workdirpath, branchToUpdate, curr_majorHash, upstream_branch, url){
    try {
        await gitCheckout(workdirpath, branchToUpdate)
        await setUpstream(workdirpath, upstream_branch)
        const responseobj = await pushChecker(projName, username, timestamp, branchToUpdate, barerepopath, workdirpath, curr_majorHash)
                            // .catch( async (err) => { // If ever you want to perform a cleanUp for removeFromIPFS error, refine this catch block so that it can actually catch that error and remove the current workDir.
                            //     console.log(err);
                            //     await rmWorkdir(workdirpath); // Remove the workdir folder from old branchNamePath
                            //     reject(new Error(`(pushChecker) err ${err.name} :- ${err.message}`)); 
                            // });
        console.log("pushchecker returned this: \n", responseobj);
        return ({
            projName: projName, 
            majorHash: responseobj.ipfsHash, 
            statusLine: responseobj.statusLine, 
            mergeObj: responseobj.mergeObj, 
            url: url
        });
    } catch(err) {
        console.log(err);
        throw new Error(`(checkoutBranch) main err ${err.name} :- ${err.message}`);
    }
}

function gitCheckout(workdirpath, branchToUpdate) {
    return new Promise ((resolve, reject) => {
        try {
            exec(`git checkout ${branchToUpdate}`, {
                cwd: workdirpath,
                shell: true
            }, (err,stdout,stderr) => {
                if(err) { console.log(err); reject(new Error(`(checkoutBranch) git-checkout cli err ${err.name} :- ${err.message}`));}
                //if(stderr) {console.log('stderr: '+stderr);reject(`git-checkout cli stderr: ${stderr}`);}
                resolve(true);
            })
        }catch(err){
            reject(new Error(`(checkoutBranch) git-checkout err ${err.name} :- ${err.message}`));
        }
    })
}

function setUpstream(workdirpath, upstream_branch) {
    return new Promise((resolve, reject) => {
        try {
            exec(`git branch --set-upstream-to=${upstream_branch}`, {
                cwd: workdirpath,
                shell: true
            }, (err, stdout, stderr) => {
                if (err) { console.log(err); reject(new Error(`(checkoutBranch) git-setupstream err ${err.name} :- ${err.message}`)); }
                if (stderr) { console.log(stderr); reject(new Error(`(checkoutBranch) git-setupstream stderr: ${stderr}`)); }
                console.log(stdout);
            })
            resolve(true);
        } catch(err) {
            console.log(err);
            reject(new Error(`(checkoutBranch) git-branch-setUpstream err ${err.name} :- ${err.message}`));
        } 
    })
}

module.exports = router;