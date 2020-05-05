/**
*  - Check between bare repo status and username work dir status
*  - Called when the Merge Conflict page is loaded. (componentDidMount)
*  - Utility.
*      - `git pull barerepo master`
*      - if conflicts arise, { do the same that you did for mergeFiles route when conflicts arise }.
*      - if conflicts dont arise, pull will be successful.
*/

// Misc:
const addToIPFS = require('../utilities/addToIPFS');
const preRouteChecks = require('../utilities/preRouteChecks');
const removeFromIPFS = require('../utilities/removeFromIPFS');
const rmWorkdir = require('../utilities/rmWorkdir');

// Terminal execution:
const { exec } = require('child_process');

// isomorphic-git related imports and setup
const fs = require('fs');
const git = require('isomorphic-git'); 

const path = require('path');
const express = require('express');
const router = express.Router();


var projName, workdirpath, curr_majorHash, 
    username, branchToUpdate, barerepopath, 
    branchName, url;


router.post('/pushChecker', async (req,res) => {
    projName = req.body.projName.replace(/\s/g,'-');
    branchToUpdate = req.body.branchToUpdate.replace(/\s/g,'-');
    curr_majorHash = req.body.majorHash; // latest
    username = req.body.username.replace(/\s/g,'-');
    branchName = req.body.branchName.replace(/\s/g,'-');
    url = `http://localhost:7005/projects/bare/${projName}.git`

    barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git'); 
    workdirpath = path.resolve(__dirname, '..', 'projects', projName, username);

    try{
        await preRouteChecks(curr_majorHash, projName, username, branchToUpdate)
        .then( async () => {
            let response = await main(workdirpath)
            return response;
        })
        .then ( (response) => {
            res.status(200).send(response);
        })
    }catch(e){
        res.status(400).send(`main caller err: ${e}`);
    }
});

async function main(workdirpath){
    return new Promise ( async (resolve, reject) => {
        await gitPull(workdirpath)
        .then( (filenamearr) => {
            resolve({url: url,filenamearr:filenamearr});
        })
        .catch((e) => {
            reject(`main err: ${e}`);
        })
    })
}

async function gitPull(workdirpath){

    return new Promise( async (resolve, reject) => {
        try {
            await exec(`git pull ${barerepopath} ${branchName}`, {
                cwd: workdirpath,
                shell: true
            }, async (err, stdout, stderr) => {
                // if (err) {
                //     reject(`(pushchecker -route) git-pull cli err: ${err}`);
                // }
                // if (stderr) {
                //     reject(`(pushchecker - route) git-pull cli stderr: ${stderr}`);
                // }
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
            })
        } catch(e) {
            reject(`(pushchecker - route) git-pull err: ${e}`)
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