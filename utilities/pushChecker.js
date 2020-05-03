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

module.exports = async function pushChecker(projName, username, branchName) {
    barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git'); 
    workdirpath = path.resolve(__dirname, '..', 'projects', projName, username);

    return new Promise ( async (resolve, reject) => {
        gitPull(workdirpath, projName, username, branchName)
        .then( (files) => {
            resolve(files);
        })
        .catch((e) => {
            reject(`main err: ${e}`);
        })
    })
}

async function gitPull(workdirpath, projName, username, branchName){

    return new Promise( async (resolve, reject) => {
        try {
            await exec(`git pull ${barerepopath}`, {
                cwd: workdirpath,
                shell: true
            }, async (err, stdout, stderr) => {
                console.log(stdout);
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
            reject(`(pushchecker) git-pull err: ${e}`)
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