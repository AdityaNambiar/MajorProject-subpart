/**
 * - `git fetch`
 * - `git status`:-
 *      - Extract the line the "This branch is ahead / behind n commits ...."
 *      - Three different lines are:
 *          -- (default) Your branch is up to date with 'origin/master'.
 *          -- Your branch and 'origin/master' have diverged,
 *          -- Your branch is ahead of 'origin/master'
 *          -- Your branch is behind 'origin/master' by 1 commit.
 */


// Misc:
const addToIPFS = require('./addToIPFS');
const preRouteChecks = require('./preRouteChecks');
const pushToBare = require('./pushToBare');

// Terminal execution:
const { exec } = require('child_process');

// isomorphic-git related imports and setup
const fs = require('fs');
const git = require('isomorphic-git');
git.plugins.set('fs',fs); // Bring your own file system 

const path = require('path');
const express = require('express');
const router = express.Router();


var barerepopath, workdirpath;

module.exports = async function statusChecker(projName, username) {

    barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git'); 
    workdirpath = path.resolve(__dirname, '..', 'projects', projName, username);

    return new Promise( async (resolve, reject) => {
        await gitFetch(workdirpath, branchName)
        .then( async () => {
            let statusLine = await gitStatus(workdirpath)
            return statusLine;
        })
        .then( (statusLine) => {
            resolve(statusLine);
        })
        .catch((e) => {
            reject(`main err: ${e}`);
        })
    })
}

async function gitFetch(workdirpath) {
    return new Promise (async (resolve, reject) => {
        try {
            exec(`git fetch ${barerepopath} master`, {
                cwd: workdirpath,
                shell: true
            }, (err, stdout, stderr) => {
                if (err) { 
                    reject(`git-fetch cli err: ${err}`);
                }
                if (stderr) {
                    reject(`git-fetch cli stderr: ${stderr}`);
                }
                console.log(stdout);
                resolve(true);
            })
        } catch(e) {
            reject(`get-fetch caught err: ${e}`);
        }
    })
}

async function gitStatus(workdirpath) {
    return new Promise (async (resolve, reject) => {
        try {
            exec(`git status`, {
                cwd: workdirpath,
                shell: true
            }, (err, stdout, stderr) => {
                if (err) { 
                    reject(`git-status cli err: ${err}`);
                }
                if (stderr) {
                    reject(`git-status cli stderr: ${stderr}`);
                }
                console.log(stdout);
                let statusLine = stdout.trim().split('\n')[1];
                resolve(statusLine);    
            })
        } catch(e) {
            reject(`get-status caught err: ${e}`);
        }
    })
}

module.exports = router;