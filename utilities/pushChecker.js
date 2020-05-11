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

module.exports = function pushChecker(projName, username, timestamp, branchName, barerepopath, workdirpath, curr_majorHash, oldBranchName = null, onDeleteBranch = false, branchToDelete = null) {
    var mainResponse = {
        statusLine: '',
        mergeObj: null,
        ipfsHash: ''
    }

    return new Promise(async (resolve, reject) => {
        try {
            let mainResp = await gitPull(mainResponse, projName, username, timestamp, branchName, barerepopath, workdirpath, curr_majorHash, oldBranchName, onDeleteBranch, branchToDelete)
            resolve(mainResp);
        } catch (err) {
            console.log(err);
            reject(new Error(`(gitPull) err ${err.name} :- ${err.message}`));
        }
    })
}

function gitPull(mainResponse, projName, username, timestamp, branchName, barerepopath, workdirpath, curr_majorHash, oldBranchName, onDeleteBranch, branchToDelete) {
    var dir_name = username + timestamp;
    var branchNamepath = path.resolve(__dirname, '..', 'projects', projName, branchName);
    
    return new Promise(async(resolve, reject) => {
        var command; 
        if (oldBranchName) {
            command = `git pull '${barerepopath}' '${oldBranchName}'`
        } else { 
            command = `git pull '${barerepopath}' '${branchName}'`
        }
        try {
            exec(command, {
                cwd: workdirpath,
                shell: true
            }, async (err, stdout, stderr) => {
                if (err) { console.log('(gitPull) cli err', err);}
                if (stderr) { console.log('(gitPull) cli stderr', stderr); }
                console.log(`git pull stdout: \n`,stdout);
                var output = stdout.split('\n');
                var arr = [];
                var elem_rgx = new RegExp(/CONFLICT/);
                var inbetweenbrackets_rgx = new RegExp(/\((.*)\):/); // defines capturing group for picking up the stuff within parenthesis
                if (output.some((e) => elem_rgx.test(e))) { // TRUE - if any output line consist of "CONFLICT" keyword in it. 
                
                    //output.push("CONFLICT (add/add): Merge conflict in DESC4")
                    //output.push("CONFLICT (modify/delete): Merge conflict in DESC4")

                    for (var i = 0; i < output.length; i++) {
                        if (output[i].match(inbetweenbrackets_rgx) != null) {
                            // form an array of types of conflict occured.. like ['content', 'add/add', 'modify/delete', 'content' etc..]
                            arr.push(output[i].match(inbetweenbrackets_rgx)[1]);
                        }
                    }
                    if (!arr.every((e) => e === "content")) { // If the array contains anything else than "content" type conflicts. Throw the error with instructions.
                        fs.writeFile(path.join(workdirpath, `${dir_name}.json`), JSON.stringify({
                            type: 'special',
                            title: `Merge conflict raised pulling ${branchName} branch`
                        }), { flag: 'w' }, (err) => {
                            console.log(err);
                            reject(new Error(`(pushChecker) gitPull-jsonWriteForSpecial err ${err.name} :- ${err.message}`))    
                        })
                    } else {
                        fs.writeFile(path.join(workdirpath, `${dir_name}.json`), JSON.stringify({
                            type: 'pull',
                            title: `Merge conflict raised pulling ${branchName} branch`
                        }), { flag: 'w' }, (err) => {
                            console.log(err);
                            reject(new Error(`(pushChecker) gitPull-jsonWriteForPull err ${err.name} :- ${err.message}`))    
                        })
                    }
                    reject(new Error("conflict"));
                } else { // if merge was successful in `git pull`
                    try {
                        if (onDeleteBranch){ // If pushChecker is on deleteBranch route
                            await deleteBranchAtBare(barerepopath, workdirpath, branchToDelete)
                            mainResponse.statusLine = await statusChecker(barerepopath, branchNamepath, username);
                            mainResponse.ipfsHash = await addToIPFS(barerepopath);
                            await removeFromIPFS(curr_majorHash)
                            await rmWorkdir(workdirpath);
                            mainResponse.mergeObj = await getMergeObj(projName, branchName, barerepopath, branchNamepath);
                            resolve(mainResponse);
                        }
                        else{ 
                            mainResponse.statusLine = await statusChecker(barerepopath, branchNamepath, username);
                            await pushToBare(barerepopath, workdirpath, branchName)
                            mainResponse.ipfsHash = await addToIPFS(barerepopath);
                            await removeFromIPFS(curr_majorHash)
                            await rmWorkdir(workdirpath);
                            mainResponse.mergeObj = await getMergeObj(projName, branchName, barerepopath, branchNamepath);
                            resolve(mainResponse);
                        }
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
                    mainResponse.mergeObj = await getMergeObj(projName, branchName, barerepopath, branchNamepath);
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
