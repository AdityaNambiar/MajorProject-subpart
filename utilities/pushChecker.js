/**
*  - Check between bare repo status and username work dir status
*  - Called when the Merge Conflict page is loaded. (componentDidMount)
*  - Utility.
*      - `git pull barerepo master`
*      - if conflicts arise, { do the same that you did for mergeFiles route when conflicts arise }.
*      - if conflicts dont arise, pull will be successful.
*/

// Terminal execution:
const { exec } = require('child_process');

// isomorphic-git related imports and setup
const fs = require('fs');
const git = require('isomorphic-git');
git.plugins.set('fs',fs); // Bring your own file system 

const path = require('path');


// vars used as global:
var barerepopath, workdirpath;

// elements to cover merge conflicts:
var conflicted_output = []; 
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
            }, async (err, stdout, stderr) => {
                // if (err) {
                //     reject(`(pushchecker) git-pull cli err: ${err}`);
                // }
                // if (stderr) {
                //     reject(`(pushchecker) git-pull cli stderr: ${stderr}`);
                // }
                console.log(stdout);

                await exec(`git diff --name-only --diff-filter=U`, {
                    cwd: workdirpath,
                    shell: true
                }, (err, stdout, stderr) => {
                    if (err) console.log(`unmerged file show cli err: ${err}`)
                    if (stderr) console.log(`unmerged file show cli stderr: ${stderr}`)
                    filename_arr = stdout.split('\n');
                })
                
                console.log('filename arr: \n', filename_arr);
                resolve(filename_arr);
            })
        } catch(e) {
            reject(`(pushchecker) git-pull err: ${e}`)
        }
    })
}