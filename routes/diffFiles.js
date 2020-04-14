/**
 * Get the file names from request.
 * Pass the file / file buffer of both files.
 */

 
// Misc:
const addToIPFS = require('../utilities/addToIPFS');
const preRouteChecks = require('../utilities/preRouteChecks');
const removeFromIPFS = require('../utilities/removeFromIPFS');
const pushChecker = require('../utilities/pushChecker');

const { exec } = require('child_process');
// isomorphic-git related imports and setup
const fs = require('fs');
const git = require('isomorphic-git');
git.plugins.set('fs',fs); // Bring your own file system 

const path = require('path');
const express = require('express');
const router = express.Router();

var projName, branchName, workdirpath, 
    curr_majorHash, username, ref1, ref2;
// vars used as global:
var branchToUpdate, files, upstream_branch, barerepopath;

router.post('/diffFiles', async (req,res) => {
    projName = req.body.projName.replace(/\s/g,'-');
    branchName = req.body.name.replace(/\s/g,'-');
    username = req.body.username.replace(/\s/g,'-');
    curr_majorHash = req.body.majorHash;  // latest
    branchToUpdate = '';
    ref1 = req.body.ref1;
    ref2 = req.body.ref2;


    barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git'); 
    workdirpath = path.resolve(__dirname, '..', 'projects', projName, username);

    try{
        await preRouteChecks(curr_majorHash, projName, username)
        .then( async () => {
            let response = await main(projName, workdirpath, branchName, curr_majorHash)
            return response;
        })
        .then ( (response) => {
            res.status(200).send(response);
        })
    }catch(e){
        res.status(400).send(`main caller err: ${e}`);
    }
});

async function main(projName, workdirpath, branchName, curr_majorHash){
    return new Promise ( async (resolve, reject) => {
        gitDiffRefs(workdirpath, branchName)
        .then( async () => {
            await pushChecker(projName, username);
        })
        .then( async () => {
            console.log(`Pushing to branch: ${branchToUpdate}`);
            await pushToBare(projName, branchToUpdate, username);
        })
        .then( async () => {
            //await rmWorkdir(projName, username);
        })
        .then( async () => {
            // Remove old state from IPFS.
            //await removeFromIPFS(curr_majorHash, projName);
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

async function gitDiffRefs(workdirpath) {
    return new Promise(async (resolve, reject) => {
        try {
            exec(`git log -p --pretty="raw" ${ref1}...${ref2}`, {
                cwd: workdirpath,
                shell: true
            }, (err, stdout, stderr) => {
                if (err) reject(`git-setupstream err: ${err}`);
                if (stderr) reject(`git-setupstream stderr: ${stderr}`);
                console.log(stdout);

                let a = stdout.split("diff --git");
                let finalObj = [];
                for (let i = 1; i < a.length; i++) {
                    a[i] = "diff --git" + a[i];
                    let filename = a[i].split("/")[1].split(" ")[0];
                    finalObj.push({ filename: filename, patch: a[i] });
                }
                a.shift();
                console.log(finalObj);
            })
            resolve(true);
        } catch(e) {
            reject(`git-branch-setUpstream err: ${e}`)
        } 
    })
}

module.exports = router;