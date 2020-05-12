/**
 * Show the 'branch diagram' or 'git log graph' on frontend.
 */

// Misc:
const preRouteChecks = require('../utilities/preRouteChecks');
const pushChecker = require('../utilities/pushChecker');
const cleanUp = require('../utilities/cleanUp');

// Terminal execution import
const { exec } = require('child_process');

// isomorphic-git related imports and setup
const fs = require('fs');
const git = require('isomorphic-git'); 

const path = require('path');
const express = require('express');
const router = express.Router();

router.post('/mergeBranch',  async (req,res) => {
    var projName = req.body.projName ;
    var branchToUpdate = req.body.branchToUpdate ; // Branch checkedout to (destination branch)
    var curr_majorHash = req.body.majorHash; // latest
    var username = req.body.username ;
    var branchName = "origin/"+req.body.branchName ; // Source / Incoming branch
    var url = `http://localhost:7005/projects/bare/${projName}.git`

    var timestamp = "(|)-|-(|)" + Date.now();

    var barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName + '.git');  
    var workdirpath = path.resolve(__dirname, '..', 'projects', projName, branchToUpdate, username+timestamp);

    try{
        await preRouteChecks(curr_majorHash, projName, username, timestamp, branchToUpdate)
        let response = await main(projName, barerepopath, workdirpath,  username, timestamp, branchName, branchToUpdate, curr_majorHash, url)
        if (response === "Conflict(s) occured while merging branch!") throw new Error(response);
        res.status(200).send(response);
    }catch(err){
        if (err.message === "Conflict(s) occured while merging branch!")
            res.status(400).send(`${err.message}`);
        else 
            res.status(400).send(`(mergeBranch) err ${err.name}:- ${err.message}`);
    }
}); 

async function main(projName, barerepopath, workdirpath,  username, timestamp, branchName, branchToUpdate, curr_majorHash, url) {
    try {
            let retval = await mergeBranch(workdirpath,  username, timestamp, branchName, branchToUpdate)
            if (retval === "Conflict(s) occured while merging branch!")
                return(retval); // Error message being sent back to main's caller.
            else {
                const responseobj = await pushChecker(projName, username, timestamp, branchToUpdate, barerepopath, workdirpath, curr_majorHash); 
                console.log("pushchecker returned this: \n", responseobj);    
                return({
                    projName: projName, 
                    majorHash: responseobj.ipfsHash, 
                    statusLine: responseobj.statusLine, 
                    mergeObj: responseobj.mergeObj, 
                    url: url
                });
            }
        } catch (err) {
            console.log(err);
            await cleanUp(workdirpath, err.message);
            throw new Error(`(mergeBranch) main err ${err.name} :- ${err.message}`);
        }
}

async function mergeBranch(workdirpath, username, timestamp, branchName, branchToUpdate){
    return new Promise((resolve, reject) => {
        let dir_name = username+timestamp;
        try {
            exec('git merge '+branchName , {
                cwd: workdirpath,
                shell: true,
            }, (err, stdout, stderr) => {
                if (err) { // when conflicts occur, it returns '$?' (exit status code) as non-zero. So this will pop up as an error from exec(). 
                    console.log(`(mergeBranch) git-merge cli err: ${err}`);
                }
                if (stderr) {
                    console.log(`(mergeBranch) git-merge cli stderr: ${stderr}`);
                }
                console.log(stdout);
                var output = stdout.split('\n');
                var arr = [];
                var elem_rgx = new RegExp(/CONFLICT/);
                var inbetweenbrackets_rgx = new RegExp(/\((.*)\):/); // defines capturing group for picking up the stuff within parenthesis
                if (output.some((e) => elem_rgx.test(e))){ // TRUE - if any output line consist of "CONFLICT" keyword in it. 
                    //output.push("CONFLICT (add/add): Merge conflict in DESC4")
                    //output.push("CONFLICT (modify/delete): Merge conflict in DESC4")
                    

                    for (var i = 0; i < output.length; i++){
                        if (output[i].match(inbetweenbrackets_rgx) != null) {
                            // form an array of types of conflict occured.. like ['content', 'add/add', 'modify/delete', 'content' etc..]
                            arr.push(output[i].match(inbetweenbrackets_rgx)[1]); 
                        }
                    }
                    if (!arr.every((e) => e == "content")){ // If the array contains anything else than "content" type conflicts. Throw the error with instructions.
                        fs.writeFile(path.join(workdirpath, `${dir_name}.json`), JSON.stringify({
                            type: 'special',
                            title: `Merge conflict raised when merging ${branchName} into ${branchToUpdate}`
                        }), { flag: 'w' },(err) => {
                            if (err) {
                                console.log(err);
                                reject(new Error(`(mergeBranch) gitMerge-jsonWriteForSpecial err ${err.name} :- ${err.message}`))
                            }
                        })
                    } else {
                        fs.writeFile(path.join(workdirpath, `${dir_name}.json`), JSON.stringify({
                            type: 'branch',
                            title: `Merge conflict raised when merging ${branchName} into ${branchToUpdate}`
                        }), { flag: 'w' },(err) => {
                            if (err) {
                                console.log(err);
                                reject(new Error(`(mergeBranch) gitMerge-jsonWriteForBranch err ${err.name} :- ${err.message}`))
                            }
                        })
                    }
                    reject(new Error('Conflict(s) occured while merging branch!'));
                } else {
                    resolve(true);
                }
            })
        } catch(err) {
            if (err.message === "Conflict(s) occured while merging branch!")
                resolve(e.message)
            else {
                console.log(err)
                reject(new Error(`(mergeBranch) gitMerge err ${err.name} :- ${err.message}`))
            }
        }
    })
}

module.exports = router