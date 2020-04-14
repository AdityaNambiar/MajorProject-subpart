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
git.plugins.set('fs',fs); // Bring your own file system 

const path = require('path');
const express = require('express');
const router = express.Router();


// vars used as global:
var barerepopath, workdirpath;

// elements to cover merge conflicts:
var conflict_files_arr = []; 
var filename_arr = []; 

module.exports = async function pushChecker(projName, username) {
    barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git'); 
    workdirpath = path.resolve(__dirname, '..', 'projects', projName, username);

    return new Promise ( async (resolve, reject) => {
        gitPull(workdirpath)
        .then( (files) => {
            resolve(files);
        })
        .catch((e) => {
            reject(`main err: ${e}`);
        })
    })
}

async function gitPull(workdirpath){
    return new Promise( async (resolve, reject) => {
        try {
            await exec(`git pull ${barerepopath}`, {
                cwd: workdirpath,
                shell: true
            }, (err, stdout, stderr) => {
                if (err) {
                    reject(`(pushchecker) git-pull cli err: ${err}`);
                }
                // if (stderr) {
                //     reject(`(pushchecker) git-pull cli stderr: ${stderr}`);
                // }
                console.log(stdout);

                conflict_files_arr = stdout.split('\n');
                console.log(conflict_files_arr);
                
                var elem_rgx = new RegExp(/CONFLICT/);
                //console.log(conflict_files_arr.some((e) => elem_rgx.test(e)));
                if (conflict_files_arr.some((e) => elem_rgx.test(e))){ // Check if there is any "conflict" line on output
                    var filename_rgx = new RegExp(/([a-zA-Z0-9]+)\.[a-zA-Z0-9]+/);
                    conflict_files_arr.forEach((elem) => {
                        if (elem_rgx.test(elem)){ // If we get a conflicted element.
                            var filename = filename_rgx.exec(elem)[0]
                            filename_arr.push(filename);
                        }
                    })
                }
                console.log(filename_arr);
                resolve(filename_arr);
            })
        } catch(e) {
            reject(`(pushchecker) git-pull err: ${e}`)
        }
    })
}