/**
 * Add a new branch in git repo:
 * 
 * -- Also started writing proper async/await functions with this reference: https://github.com/Microsoft/TypeScript/issues/5635
 *      -- reason was that I wanted to bubble up errors properly and avoid UnhandledPromiseRejection warning.
 */
// Misc:
const preRouteChecks = require('../utilities/preRouteChecks');
const pushChecker = require('../utilities/pushChecker');
const rmWorkdir = require('../utilities/rmWorkdir')

const { exec } = require('child_process');

// isomorphic-git related imports and setup
const fs = require('fs-extra');
const git = require('isomorphic-git');

const path = require('path');
const express = require('express');
const router = express.Router();

router.post('/addBranch', async (req,res) => {
    var projName = req.body.projName;
    var username = req.body.username;
    var curr_majorHash = req.body.majorHash;  // latest
    var branchToUpdate = req.body.branchToUpdate;
    var branchName = req.body.branchName;
    var upstream_branch = 'origin/master';
    var url = `'http://localhost:7005/projects/bare/${projName}.git'`;

    var timestamp = Date.now();

    var barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git'); 
    var workdirpath = path.resolve(__dirname, '..', 'projects', projName, branchToUpdate, username+timestamp);

    try{
        await preRouteChecks(curr_majorHash, projName, username, timestamp, branchToUpdate)
        let response = await main(projName, timestamp, barerepopath, workdirpath, curr_majorHash, branchName, branchToUpdate, upstream_branch, url)
        res.status(200).send(response);
    }catch(err){
        console.log(err);
        res.status(400).send(`addBranch err ${err.name} :- ${err.message}`);
    }
})

async function main(projName, timestamp, barerepopath, workdirpath, curr_majorHash, branchName, branchToUpdate, upstream_branch, url){
        try {
            const newBranchNamePath = await branchNamePathCheck(branchName, projName) // Prepares the branchNamePath for new branch name. Adding this before gitBranchAdd() because it has to throw the "refexisterror" before creating a branch.
            await gitBranchAdd(workdirpath, branchName, branchToUpdate, projName)
            const newWorkDirPath = await moveWorkDir(timestamp, workdirpath, newBranchNamePath) // Moves workdir to new branch name path to proceed with rest ops.
            await setUpstream(newWorkDirPath, upstream_branch);
            const files = await gitListFiles(newWorkDirPath);
            const responseobj = await pushChecker(barerepopath, newWorkDirPath, timestamp, curr_majorHash)
                                // .catch( async (err) => {
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
            //await rmWorkdir(workdirpath);
            throw new Error(`(addBranch) main err ${err.name} :- ${err.message}`);
        }
}


function branchNamePathCheck(branchName, projName) {
    // This route is exclusively for addBranch route. Rest of the times, if a branchNamePath exists, then it is allowed it stay. Like written in preRouteChecks.
    let newBranchNamePath = path.resolve(__dirname, '..', 'projects', projName, branchName);
    return new Promise( (resolve, reject) => {
        if ((/\s/).test(branchName)){ 
            reject(new Error("(branchNamePathCheck) Invalid Branch Name (has spaces in it) :- "+branchName));
        } else if (!fs.existsSync(newBranchNamePath)){
            fs.mkdir(newBranchNamePath, (err) => {
                if (err) { 
                    console.log(err);
                    reject(new Error(`branchNamePathCheck err ${err.name} :- ${err.message}`));
                }
                resolve(newBranchNamePath);
            })
        } else {
            reject(new Error(`GitError [RefExistsError]: Failed to create branch "${branchName}" because branch "${branchName}" already exists.`)); 
        }
    })
}

function moveWorkDir(timestamp, workdirpath, newBranchNamePath) {
    // .../projects/projName/branchName/username+timestamp
    var username, timestamp, pathArr;
    pathArr = workdirpath.split('/');
    username = pathArr[pathArr.length - 1].split(timestamp)[0]; 
    let dir_name = username+timestamp;

    return new Promise( (resolve, reject) => {
        let newWorkDirPath = path.join(newBranchNamePath, dir_name);
        try {
            fs.move(workdirpath, newWorkDirPath, (err) => {
                if (err) { console.log(err); reject(new Error(`fs.move err ${err.name} :- ${err.message}`)); }
                resolve(newWorkDirPath);
            })
        } catch(err) {
            console.log(err);
            reject(new Error(`moveWorkDir err ${err.name} :- ${err.message}`));
        }
    })
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
    return new Promise((resolve, reject) => {
        try {
            exec(command, {
                cwd: workdirpath,
                shell: true
            }, (err,stdout,stderr) => {
                if(err) { console.log(err); reject(new Error(`git-ls-tree cli err ${err.name} :- ${err.message}`)); }
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
                    files.push(obj);
                })
                resolve(files);
            })
        }catch(err){
            console.log(err);
            reject(new Error(`git-ls-tree err ${err.name} :- ${err.message}`));
        }
    })
}

module.exports = router;
