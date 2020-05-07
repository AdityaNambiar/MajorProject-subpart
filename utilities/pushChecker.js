/**
*  - Check between bare repo status and username work dir status
*  - Called when the Merge Conflict page is loaded. (componentDidMount)
*  - Utility.
*      - `git pull barerepo master`
*      - if conflicts arise, { do the same that you did for mergeFiles route when conflicts arise }.
*      - if conflicts dont arise, pull will be successful.
*/


const pushToBare = require('./pushToBare');
const removeFromIPFS = require('./removeFromIPFS');
const addToIPFS = require('./addToIPFS');
const statusChecker = require('./statusChecker');
const rmWorkdir = require('./rmWorkdir');
const getMergeObj = require('./getMergeObj');

// Terminal execution:
const { exec } = require('child_process');

// isomorphic-git related imports and setup
const fs = require('fs');
const git = require('isomorphic-git');

const path = require('path');

module.exports = function pushChecker(barerepopath, workdirpath, timestamp, curr_majorHash, onDeleteBranch = false, branchToDelete = null) {

    var mainResponse = {
        statusLine: '',
        mergeObj: {},
        ipfsHash: ''
    }

    return new Promise(async (resolve, reject) => {
        try {
            let mainResp = await gitPull(mainResponse, barerepopath, workdirpath, timestamp, curr_majorHash, onDeleteBranch, branchToDelete)
            resolve(mainResp);
        } catch (err) {
            console.log(err);
            reject(new Error(`(gitPull) err ${err.name} :- ${err.message}`));
        }
    })
}

function gitPull(mainResponse, barerepopath, workdirpath, timestamp, curr_majorHash, onDeleteBranch, branchToDelete) {
    // .../projects/projName/branchName/username+timestamp
    var projName, branchName, username, pathArr;
    pathArr = workdirpath.split('/');
    projName = pathArr[pathArr.length - 3];
    branchName = pathArr[pathArr.length - 2];
    username = pathArr[pathArr.length - 1].split(timestamp)[0];
    let dir_name = username + timestamp;
    let branchNamepath = path.resolve(__dirname, '..', 'projects', projName, branchName);

    return new Promise(async(resolve, reject) => {
        try {
            exec(`git pull '${barerepopath}' '${branchName}'`, {
                cwd: workdirpath,
                shell: true
            }, async (err, stdout, stderr) => {
                if (err) { console.log(err); reject(new Error(`(gitPull) cli err ${err.name} :- ${err.message}`)); }
                if (stderr) { console.log(stderr); }
                console.log(`git pull stdout: \n`,stdout);
                var output = stdout.split('\n');
                var arr = [];
                var elem_rgx = new RegExp(/CONFLICT/);
                var inbetweenbrackets_rgx = new RegExp(/\((.*)\)/); // defines capturing group for picking up the stuff within parenthesis
                if (output.some((e) => elem_rgx.test(e))) { // TRUE - if any output line consist of "CONFLICT" keyword in it. 

                    //output.push("CONFLICT (add/add): Merge conflict in DESC4")
                    //output.push("CONFLICT (modify/delete): Merge conflict in DESC4")
                    try {
                        fs.writeFileSync(path.join(workdirpath, `${dir_name}.json`), {
                            type: 'pull',
                            title: `Merge conflict raised pulling ${branchName} branch`
                        })
                    } catch (err) {
                        console.log(err);
                        reject(`(pushChecker) gitPull-jsonWriteForPull err ${err.name} :- ${err.message}`)
                    }

                    for (var i = 0; i < output.length; i++) {
                        if (output[i].match(inbetweenbrackets_rgx) != null) {
                            // form an array of types of conflict occured.. like ['content', 'add/add', 'modify/delete', 'content' etc..]
                            arr.push(output[i].match(inbetweenbrackets_rgx)[1]);
                        }
                    }
                    if (!arr.every((e) => e === "content")) { // If the array contains anything else than "content" type conflicts. Throw the error with instructions.
                        try {
                            fs.writeFileSync(path.join(workdirpath, `${dir_name}.json`), {
                                type: 'special',
                                title: `Merge conflict raised pulling ${branchName} branch`
                            })
                        } catch (err) {
                            console.log(err);
                            reject(`(pushChecker) gitPull-jsonWriteForSpecial err ${err.name} :- ${err.message}`)
                        }
                    }
                    throw new Error("conflict");
                } else { // if merge was successful in `git pull`
                    try {
                        if (onDeleteBranch) // If pushChecker is on deleteBranch route
                            await deleteBranchAtBare(barerepopath, workdirpath, branchToDelete)
                        else
                            await pushToBare(barerepopath, workdirpath, branchName)
                        mainResponse.ipfsHash = await addToIPFS(barerepopath);
                        await removeFromIPFS(curr_majorHash)
                        mainResponse.statusLine = await statusChecker(barerepopath, branchNamepath, username);
                        await rmWorkdir(workdirpath);
                        mainResponse.mergeObj = await getMergeObj(barerepopath, branchNamepath);
                        resolve(mainResponse);
                    } catch (err) {
                        console.log(err);
                        reject(new Error(`(pushChecker) git-pull-onNoConf err ${err.name} :- ${err.message}`));
                    }
                }
            })
        } catch (err) {
            if (err.message === "conflict") {
                try {
                    mainResponse.ipfsHash = await addToIPFS(barerepopath);
                    await removeFromIPFS(curr_majorHash);
                    mainResponse.statusLine = await statusChecker(barerepopath, branchNamepath, username);
                    mainResponse.mergeObj = await getMergeObj(barerepopath, branchNamepath);
                    resolve(mainResponse);
                } catch (err) {
                    console.log(err);
                    reject(new Error(`(pushChecker) git-pull-catch-onConf err ${err.name} :- ${err.message}`))
                }
            } else {
                console.log(err);
                reject(new Error(`(pushChecker) git-pull-catch-onNoConf err ${err.name} :- ${err.message}`))
            }
        }
    })
}

function deleteBranchAtBare(barerepopath, workdirpath, branchName) {
    console.log(`Going to delete this branch at remote: ${branchName}`);
    return new Promise((resolve, reject) => {
        try {
            exec(`git push --delete '${barerepopath}' '${branchName}' `, {
                cwd: workdirpath,
                shell: true
            }, (err, stdout, stderr) => {
                if (err) { console.log(err); reject(new Error(`(deleteBranchAtBare) git push cli err ${err.name} :- ${err.message}`)); } 
                if (stderr) { console.log(`(deleteBranchAtBare) git push cli stderr: ${stderr}`); } 
                console.log('git push cli stdout: ',stdout)
                resolve(true);
            })
        } catch (err) {
            console.log(err);
            reject(new Error(`(deleteBranchAtBare) git-push-delete err ${err.name} :- ${err.message}`))
        }
        
    })
}
