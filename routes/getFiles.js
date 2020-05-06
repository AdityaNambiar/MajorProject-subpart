
/**
 * Get (Read) list of files in current branch of git repository.
 * (No changes in .git/ folder - confirmed)
 */

// Misc:
const preRouteChecks = require('../utilities/preRouteChecks');
const pushChecker = require('../utilities/pushChecker');

// Terminal execution import
const { exec } = require('child_process');

// isomorphic-git related imports and setup
const fs = require('fs-extra');
const git = require('isomorphic-git'); 

const path = require('path');
const express = require('express');
const router = express.Router();

router.post('/getFiles', async (req,res) => {
    var projName = req.body.projName;
    var username = req.body.username;
    var curr_majorHash = req.body.majorHash;  // latest
    var branchToUpdate = req.body.branchToUpdate;
    var upstream_branch = 'origin/master';
    var url = `http://localhost:7005/projects/bare/${projName}.git`;

    var timestamp = Date.now();

    var barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git'); 
    var workdirpath = path.resolve(__dirname, '..', 'projects', projName, branchToUpdate, username+timestamp);

    try{
        await preRouteChecks(curr_majorHash, projName, username, timestamp, branchToUpdate)
        let response = await main(projName, timestamp, barerepopath, workdirpath, branchToUpdate, curr_majorHash, upstream_branch, url)
        res.status(200).send(response);
    }catch(err){
        console.log(err);
        res.status(400).send(` (getFiles) main caller err ${err.name} :- ${err.message}`);
    }
})

async function main(projName, timestamp, barerepopath, workdirpath, branchToUpdate, curr_majorHash, upstream_branch, url){
    try {
        await gitCheckout(workdirpath, branchToUpdate)
        await setUpstream(workdirpath, upstream_branch)
        const files = await gitListFiles(workdirpath)
        const responseobj = await pushChecker(barerepopath, workdirpath, timestamp, curr_majorHash)
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
            mergeArr: responseobj.mergeObj, 
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
                console.log(stdout);
            })
            resolve(true);
        } catch(err) {
            console.log(err);
            reject(new Error(`git-branch-setUpstream err ${err.name} :- ${err.message}`));
        } 
    })
}
function gitListFiles(workdirpath) {
    let command = `FILES="$(git ls-tree --name-only HEAD .)";IFS="$(printf "\n\b")";for f in $FILES; do    str="$(git log -1 --pretty=format:"%s%x28%x7c%x29%x2D%x7c%x2D%x28%x7c%x29%cr" $f)";  printf "%s(|)-|-(|)%s\n" "$f" "$str"; done`;
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
                    let file = output_arr.split('(|)-|-(|)')[0];
                    let commitmsg = output_arr.split('(|)-|-(|)')[1];
                    let time = output_arr.split('(|)-|-(|)')[2];
                    let obj = { file: file, commitmsg: commitmsg, time: time}
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