
/**
 * Get (Read) list of files in current branch of git repository.
 * (No changes in .git/ folder - confirmed)
 */

// Misc:
const preRouteChecks = require('../utilities/preRouteChecks');
const pushChecker = require('../utilities/pushChecker');
const rmWorkdir = require('../utilities/rmWorkdir');
const statusChecker = require('../utilities/statusChecker');
// Terminal execution import
const { exec } = require('child_process');

// isomorphic-git related imports and setup
const fs = require('fs-extra');
const git = require('isomorphic-git'); 

const path = require('path');
const express = require('express');
const router = express.Router();

router.post('/getFiles', async (req,res) => {
    let projName = req.body.projName;
    let username = req.body.username;
    let curr_majorHash = req.body.majorHash;  // latest
    let branchToUpdate = req.body.branchToUpdate;
    let foldername = req.body.foldername || undefined;
    let upstream_branch = 'origin/master';
    let url = `'http://localhost:7005/projects/bare/${projName}.git'`;

    let timestamp = "(|)-|-(|)" + Date.now();

    let barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git'); 
    let branchNamepath = path.resolve(__dirname, '..', 'projects', projName, branchToUpdate);
    let workdirpath = path.resolve(__dirname, '..', 'projects', projName, branchToUpdate, username+timestamp);

    try{
        await preRouteChecks(curr_majorHash, projName, username, timestamp, branchToUpdate)
        let response = await main(projName, foldername, username, barerepopath, branchNamepath, workdirpath, branchToUpdate, upstream_branch, url)
        res.status(200).send(response);
    }catch(err){
        console.log(err);
        res.status(400).send(` (getFiles) main caller err ${err.name} :- ${err.message}`);
    }
})

async function main(projName, foldername, username, barerepopath, branchNamepath, workdirpath, branchToUpdate, upstream_branch, url){
    try {
        await gitCheckout(workdirpath, branchToUpdate)
        await setUpstream(workdirpath, upstream_branch)
        const files = await gitListFiles(workdirpath, foldername)
        const statusLine = await statusChecker(barerepopath, branchNamepath, username);
        return ({
            projName: projName,
            statusLine: statusLine,
            url: url,
            files: files
        });
    } catch(err) {
        console.log(err);
        throw new Error(`(getFiles) main err ${err.name} :- ${err.message}`);
    }
}

function gitCheckout(workdirpath, branchToUpdate) {
    return new Promise ((resolve, reject) => {
        try {
            exec(`git checkout ${branchToUpdate}`, {
                cwd: workdirpath,
                shell: true
            }, (err,stdout,stderr) => {
                if(err) { console.log(err); reject(new Error(`git-checkout cli err ${err.name} :- ${err.message}`));}
                //if(stderr) {console.log('stderr: '+stderr);reject(`git-checkout cli stderr: ${stderr}`);}
                resolve(true);
            })
        }catch(err){
            reject(new Error(`git-checkout err ${err.name} :- ${err.message}`));
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
                if (err) { console.log(err); reject(new Error(`git-setupstream err ${err.name} :- ${err.message}`)); }
                if (stderr) { console.log(stderr); reject(new Error(`git-setupstream stderr: ${stderr}`)); }
                //console.log(stdout);
            })
            resolve(true);
        } catch(err) {
            console.log(err);
            reject(new Error(`git-branch-setUpstream err ${err.name} :- ${err.message}`));
        } 
    })
}
function gitListFiles(workdirpath, foldername) {
    let command = ``;
    if (!foldername){ // If foldername remains 'undefined'
        command = `TYPES="$(git ls-tree HEAD . | awk '{ print $2 }')"; set -- $TYPES; FILES="$(git ls-tree --name-only HEAD .)"; IFS="$(printf "\n\b")"; for f in $FILES; do    str="$(git log -1 --pretty=format:"%s%x28%x7c%x29%x2D%x7c%x2D%x28%x7c%x29%cr" $f)";  printf "%s(|)-|-(|)%s(|)-|-(|)%s\n" "$f" "$str" "$1"; shift; done`;
    } else {
        command = `TYPES="$(git ls-tree HEAD ${foldername} | awk '{ print $2 }')"; set -- $TYPES; FILES="$(git ls-tree --name-only HEAD ${foldername})"; IFS="$(printf "\n\b")"; for f in $FILES; do    str="$(git log -1 --pretty=format:"%s%x28%x7c%x29%x2D%x7c%x2D%x28%x7c%x29%cr" $f)";  printf "%s(|)-|-(|)%s(|)-|-(|)%s\n" "$f" "$str" "$1"; shift; done`;
    }
    return new Promise (async (resolve, reject) => {
        try {
            exec(command, {
                cwd: workdirpath,
                shell: true
            }, (err,stdout,stderr) => {
                if(err) { console.log(err); reject(new Error(`git-ls-tree cli err ${err.name} :- ${err.message}`));}
                //if(stderr) {console.log('stderr: '+stderr);reject(`git-ls-tree cli stderr: ${stderr}`);}
                
                /**
                 * 1. Convert stdout to string array
                 * 2. Split by '(|)-|-(|)' seperator. Had to decide upon a weirdest symbol - my imaginations are helpful with this. Thanks lenny face.
                 * 3. create an object and pass it out of this function in resolve().
                 */
                let files = [];
                stdout.trim().split('\n').forEach( output_arr => {
                    let file = null;
                    if (foldername){ // if foldername's value is not undefined 
                        let rgx = new RegExp(`${foldername}\/(.*)`); // for values like "ipfsRoutes/createDoc.js" -> Fetch "createDoc.js"
                        let str = output_arr.split('(|)-|-(|)')[0];
                        file = str.match(rgx)[1];
                    } else {
                        file = output_arr.split('(|)-|-(|)')[0]; 
                    }
                    let commitmsg = output_arr.split('(|)-|-(|)')[1];
                    let time = output_arr.split('(|)-|-(|)')[2];
                    let type = output_arr.split('(|)-|-(|)')[3];
                    let obj = { file: file, commitmsg: commitmsg, time: time, type: type }
                    //console.log(obj);
                    files.push(obj);
                })
                resolve(files);
            })
        }catch(err){
            reject(new Error(`git-ls-tree err ${err.name} :- ${err.message}`));
        }
    })
}

module.exports = router;