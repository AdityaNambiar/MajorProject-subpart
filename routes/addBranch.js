/**
 * Add a new branch in git repo:
 */
// Misc:
const addToIPFS = require('../utilities/addToIPFS');
const preRouteChecks = require('../utilities/preRouteChecks');
const removeFromIPFS = require('../utilities/removeFromIPFS');
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


var projName, branchName, workdirpath, 
    curr_majorHash, username;
// vars used as global:
var branchToUpdate, files, upstream_branch, barerepopath,
    filenamearr;

router.post('/addBranch', async (req,res) => {
    projName = req.body.projName.replace(/\s/g,'-');
    branchName = req.body.branchName.replace(/\s/g,'-');
    username = req.body.username.replace(/\s/g,'-');
    curr_majorHash = req.body.majorHash;  // latest
    branchToUpdate = req.body.branchToUpdate;
    upstream_branch = 'origin/master';

    barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git'); 
    workdirpath = path.resolve(__dirname, '..', 'projects', projName, username);

    try{
        await preRouteChecks(curr_majorHash, projName, username, branchToUpdate)
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
})

async function main(projName, workdirpath, branchName, curr_majorHash){
    return new Promise ( async (resolve, reject) => {
        gitBranchAdd(workdirpath, branchName)
        .then( async () => {
            await setUpstream(workdirpath, upstream_branch);
        })
        .then( async () => {
            // 'files' arr should be filled up.
            files = await gitListFiles(workdirpath);
        })
        .then( async () => {
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
            console.log("MajorHash (git addBranch): ", majorHash);
            console.log(` Files: ${files}`);
            resolve({projName: projName, majorHash: majorHash,
                     files: files, filenamearr: filenamearr});
        })
        .catch((e) => {
            reject(`main err: ${e}`);
        })
    })
}

async function gitBranchAdd(workdirpath, branchName) {
    return new Promise (async (resolve, reject) => {
        try {
            await git.branch({
                dir: workdirpath,
                ref: branchName,
                checkout: true
            })
            branchToUpdate = branchName;
            resolve(true);
        } catch(e) {
            reject(`git-branch err: ${e}`);
        }
    })
}

async function setUpstream(workdirpath, upstream_branch) {
    return new Promise(async (resolve, reject) => {
        try {
            exec(`git branch --set-upstream-to=${upstream_branch}`, {
                cwd: workdirpath,
                shell: true
            }, (err, stdout, stderr) => {
                if (err) reject(`git-setupstream err: ${err}`);
                if (stderr) reject(`git-setupstream stderr: ${stderr}`);
                console.log(stdout);
            })
            resolve(true);
        } catch(e) {
            reject(`git-branch-setUpstream err: ${e}`)
        } 
    })
}

async function gitListFiles(workdirpath) {
    let command = `FILES="$(git ls-tree --name-only HEAD .)";IFS="$(printf "\n\b")";for f in $FILES; do    str="$(git log -1 --pretty=format:"%s%x2D%cr" $f)"  printf "%s-%s\n" "$f" "$str" done`;
    return new Promise (async (resolve, reject) => {
        try {
            exec(command, {
                cwd: workdirpath,
                shell: true
            }, (err,stdout,stderr) => {
                if(err) reject(`git-ls-tree cli err: ${err}`);
                if(stderr) reject(`git-ls-tree cli stderr: ${stderr}`);
                console.log(stdout);
            })
            resolve(files);
        }catch(e){
            reject(`git-ls-tree err: ${e}`);
        }
    })
}

module.exports = router;
/*
async function gitBranchCheckout(workdirpath, branchName) {
    return new Promise (async (resolve, reject) => {
        try {
            await git.checkout({
                dir:  workdirpath,
                ref: branchName,
            });
            resolve(true);
        } catch(e) {
            reject(`git-checkout-cli err: ${e}`)
        }
    })
}
*/
