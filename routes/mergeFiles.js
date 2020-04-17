/**
 * Show the 'branch diagram' or 'git log graph' on frontend.
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
git.plugins.set('fs',fs); // Bring your own file system 

const path = require('path');
const express = require('express');
const router = express.Router();


var projName, workdirpath, curr_majorHash, 
    username, branchToUpdate, majorHash, 
    barerepopath, merge_op, statusLine,
    branchName;


router.post('/mergeFiles',  async (req,res) => {
    projName = req.body.projName.replace(/\s/g,'-');
    branchToUpdate = req.body.branchToUpdate.replace(/\s/g,'-'); // Branch checkedout to (destination branch)
    curr_majorHash = req.body.majorHash; // latest
    username = req.body.username.replace(/\s/g,'-');
    branchName = req.body.branchName.replace(/\s/g,'-'); // Source / Incoming branch 
    
    barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git'); 
    workdirpath = path.resolve(__dirname, '..', 'projects', projName, username);

    try{
        await preRouteChecks(curr_majorHash, projName, username, branchToUpdate)
        .then( async () => {
            let response = await main(projName, workdirpath, username, curr_majorHash)
            return response;
        })
        .then ( (response) => {
            res.status(200).send(response);
        })
    }catch(e){
        res.status(400).send(`main caller err: ${e}`);
    }
}); 

async function main(projName, workdirpath, username, curr_majorHash) {
    return new Promise ( async (resolve, reject) => {
        try {
            await mergeFiles(workdirpath, branchName)
            .then ( async (arr) => {
                merge_op = arr
                statusLine = await statusChecker(projName, username);
                return statusLine;
            })
            if (merge_op.length == 0) {  // if no conflicts only then proceed with cleaning up.
                console.log(`Pushing to branch: ${branchToUpdate}`);
                await pushToBare(projName, branchToUpdate, username)
                .then( async () => {
                    await rmWorkdir(projName, username);
                })
                .then( async () => {
                    // Remove old state from IPFS.
                    await removeFromIPFS(curr_majorHash, projName);
                })
                .then( async () => {
                    // Add new state to IPFS.
                    majorHash = await addToIPFS(barerepopath);
                    return majorHash;
                })
                .then( (majorHash) => {
                    console.log("MajorHash (git mergeFiles): ", majorHash);
                    resolve({projName: projName, majorHash: majorHash, merge_op: merge_op, statusLine: statusLine});
                })
            } else if (merge_op[0] != "Please solve this merge conflict via CLI"){
                resolve({projName: projName, majorHash: majorHash, merge_op: merge_op, statusLine: statusLine});
            } else {
                resolve({projName: projName, majorHash: curr_majorHash, merge_op: merge_op, statusLine: statusLine});
            }
        } catch (e) {
            reject(`main err: ${e}`);
        }
    })
}

async function mergeFiles(workdirpath, branchName){
    var err_obj = {};
    return new Promise( async (resolve, reject) => {
        try {
            await exec('git merge '+branchName , {
                cwd: workdirpath,
                shell: true,
            }, async (err, stdout, stderr) => {
                // if (err) {
                //     reject(`(pushchecker) git-pull cli err: ${err}`);
                // }
                // if (stderr) {
                //     reject(`(pushchecker) git-pull cli stderr: ${stderr}`);
                // }
                err_obj.err = err;
                err_obj.stderr = stderr;
                console.log(err,stdout,stderr);
                var conflict_lines_arr = stdout.split('\n');
                var filename_arr = [];
                var obj = {}, arr = [];
                var elem_rgx = new RegExp(/CONFLICT/);
                var inbetweenbrackets_rgx = new RegExp(/\((.*)\)/);
                
                if (conflict_lines_arr.some((e) => elem_rgx.test(e))){
                    //conflict_lines_arr.push("CONFLICT (add/add): Merge conflict in DESC4")
                    //conflict_lines_arr.push("CONFLICT (modify/delete): Merge conflict in DESC4")
                    for (var i = 0; i < conflict_lines_arr.length; i++){
                        if (conflict_lines_arr[i].match(inbetweenbrackets_rgx) != null) {
                            // form an array of types of conflict occured.. like ['content', 'add/add', 'modify/delete', 'content' etc..]
                            arr.push(conflict_lines_arr[i].match(inbetweenbrackets_rgx)[1]); 
                        }
                    }
                    if (!arr.every((e) => e == "content")){ // If the array contains anything else than "content" type conflicts. Throw the error with instructions.
                        filename_arr = [];
                        filename_arr.push("Please solve this merge conflict via CLI")
                        filename_arr.push(`1. git clone http://localhost:7005/projects/${projName}/${username} \n2. git checkout ${branchName} \n3. divcs pull origin \n- Fix your merge conflicts locally, then follow: \n1. divcs push origin \n Note: Unless you will be pushing onto the remote repository, \nYour local commit history would not be present when you \n operate on the web interface.
                        `)
                        resolve(filename_arr);
                    } else {
                        await exec(`git diff --name-only --diff-filter=U`, {
                            cwd: workdirpath,
                            shell: true
                        }, async (err, stdout, stderr) => {
                            if (err) console.log(`unmerged file show cli err: ${err}`)
                            if (stderr) console.log(`unmerged file show cli stderr: ${stderr}`)
                            filename_arr = [];
                            filename_arr = stdout.trim().split('\n');
                            console.log('filename arr: \n', filename_arr);
                            for (var i = 0; i < filename_arr.length; i++) {
                                obj[filename_arr[i]] = await readForBuffer(workdirpath, filename_arr[i]);
                            }
                            resolve(obj);
                        })
                    }
                } else {
                    resolve(filename_arr);
                }
            });
        }catch(e){
            //err_obj.e = e;
            reject(`mergeFiles git err: ${e}`);
        }
    })
}

async function readForBuffer(workdirpath, filename){
    return new Promise( async (resolve, reject) =>{
        // Specify this as 2nd parameter: {encoding: 'utf-8'} - to prevent getting a buffer.
        fs.readFile(path.resolve(workdirpath, filename),(err, data) => {
            if (err) {
                reject('(pushchecker) fs readfile err: '+err);
            }
            resolve(data);
        })
    })
}
module.exports = router