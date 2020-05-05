/**
 * Show the 'branch diagram' or 'git log graph' on frontend.
 */

// Misc:
const preRouteChecks = require('../utilities/preRouteChecks');
const pushChecker = require('../utilities/pushChecker');


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
    username, branchToUpdate, timestamp, 
    barerepopath, merge_op, statusLine,
    branchName, url;


router.post('/mergeFiles',  async (req,res) => {
    projName = req.body.projName.replace(/\s/g,'-');
    branchToUpdate = req.body.branchToUpdate.replace(/\s/g,'-'); // Branch checkedout to (destination branch)
    curr_majorHash = req.body.majorHash; // latest
    username = req.body.username.replace(/\s/g,'-');
    branchName = req.body.branchName.replace(/\s/g,'-'); // Source / Incoming branch 
    url = `http://localhost:7005/projects/bare/${projName}.git`

    timestamp = Date.now();

    barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git'); 
    workdirpath = path.resolve(__dirname, '..', 'projects', branchToUpdate, projName, username+timestamp);

    try{
        await preRouteChecks(curr_majorHash, projName, username, timestamp, branchToUpdate)
        let response = await main(projName, workdirpath, curr_majorHash)
        if (response === "Conflict occured while merging branch!") throw new Error(response);
        res.status(200).send(response);
    }catch(e){
        if (e.message === "Conflict occured while merging branch!")
            res.status(400).send(e.message);
        else 
            res.status(400).send(e);
    }
}); 

async function main() {
    return new Promise ( async (resolve, reject) => {
        try {
            let retval = await mergeFiles(workdirpath, username, timestamp, branchName, branchToUpdate)
            if (retval === "Conflict occured while merging branch!")
                resolve(retval); // Error message being sent back to main's caller.
            else {
                const responseobj = await pushChecker(projName, username, branchToUpdate, curr_majorHash); 
                console.log("pushchecker returned this: \n", responseobj);    
                resolve({
                    projName: projName, 
                    majorHash: responseobj.ipfsHash, 
                    statusLine: responseobj.statusLine, 
                    mergeObj: responseobj.mergeObj, 
                    url: url
                });
            }
        } catch (e) {
            reject(`main err: ${e}`);
        }
    })
}

async function mergeFiles(workdirpath, username, timestamp, branchName, branchToUpdate){
    return new Promise( async (resolve, reject) => {
        let dir_name = username+timestamp;
        try {
            await exec('git merge '+branchName , {
                cwd: workdirpath,
                shell: true,
            }, async (err, stdout, stderr) => {
                // if (err) {
                //     reject(`(mergeBranch) git-merge cli err: ${err}`);
                // }
                // if (stderr) {
                //     reject(`(mergeBranch) git-merge cli stderr: ${stderr}`);
                // }
                console.log(err,stdout,stderr);
                var output = stdout.split('\n');
                var elem_rgx = new RegExp(/CONFLICT/);
                var inbetweenbrackets_rgx = new RegExp(/\((.*)\)/); // defines capturing group for picking up the stuff within parenthesis
                if (output.some((e) => elem_rgx.test(e))){ // TRUE - if any output line consist of "CONFLICT" keyword in it. 
                    //output.push("CONFLICT (add/add): Merge conflict in DESC4")
                    //output.push("CONFLICT (modify/delete): Merge conflict in DESC4")
                    fs.writeFile(path.join(workdirpath, `${dir_name}.json`),{
                        type: 'branch',
                        title: `Merge conflict raised when merging ${branchName} into ${branchToUpdate}`
                    }, (err) => {
                        if (err) reject(`(mergeBranch) gitMerge-jsonWrite err: ${err}`)
                    })

                    for (var i = 0; i < output.length; i++){
                        if (output[i].match(inbetweenbrackets_rgx) != null) {
                            // form an array of types of conflict occured.. like ['content', 'add/add', 'modify/delete', 'content' etc..]
                            arr.push(output[i].match(inbetweenbrackets_rgx)[1]); 
                        }
                    }
                    if (!arr.every((e) => e == "content")){ // If the array contains anything else than "content" type conflicts. Throw the error with instructions.
                        fs.writeFile(path.join(workdirpath, `${dir_name}.json`), {
                            type: 'special',
                            title: `Merge conflict raised when merging ${branchName} into ${branchToUpdate}`
                        }, (err) => {
                            if (err) reject(`(mergeBranch) gitMerge-jsonWrite err: ${err}`)
                        })
                    }
                    throw new Error('Conflict occured while merging branch!');
                }
            })
        } catch(e) {
            if (e.message === "Conflict occured while merging branch!")
                resolve(e.message)
            else 
                reject(`(mergeBranch) gitMerge err: ${e}`)
        }
    })
}

module.exports = router