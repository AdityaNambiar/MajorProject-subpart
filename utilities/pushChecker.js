/**
*  - Check between bare repo status and username work dir status
*  - Called when the Merge Conflict page is loaded. (componentDidMount)
*  - Utility.
*      - `git pull barerepo master`
*      - if conflicts arise, { do the same that you did for mergeFiles route when conflicts arise }.
*      - if conflicts dont arise, pull will be successful.
*/


const addToIPFS = require('../utilities/addToIPFS');
const removeFromIPFS = require('../utilities/removeFromIPFS');
const statusChecker = require('../utilities/statusChecker');
const pushToBare = require('../utilities/pushToBare');
const rmWorkdir = require('../utilities/rmWorkdir');
const getMergeArr = require('./getMergeArr');

// Terminal execution:
const { exec } = require('child_process');

// isomorphic-git related imports and setup
const fs = require('fs');
const git = require('isomorphic-git');
git.plugins.set('fs',fs); // Bring your own file system 

const path = require('path');


// vars used as global:
var barerepopath, workdirpath, mainResponse = {}; 

module.exports = async function pushChecker(projName, username, branchName) {
    barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git'); 
    workdirpath = path.resolve(__dirname, '..', 'projects', projName, username);

    mainResponse = {
        statusLine: '',
        mergeObj: {},
        ipfsHash: ''
    }
    return new Promise ( async (resolve, reject) => {
        try {
            let files = await gitPull(workdirpath, projName, username, branchName)
            resolve(files);
        } catch(e) {
            reject(`main err: ${e}`);
        }
    })
}

function gitPull(workdirpath, projName, username, branchName, branchToUpdate){

    return new Promise( async (resolve, reject) => {
        try {
            await exec(`git pull ${barerepopath} ${branchToUpdate}`, {
                cwd: workdirpath,
                shell: true
            }, async (err, stdout, stderr) => {
                console.log(stdout);
                var output = stdout.split('\n');
                var filename_arr = [];
                var obj = {}, arr = [];
                var elem_rgx = new RegExp(/CONFLICT/);
                var inbetweenbrackets_rgx = new RegExp(/\((.*)\)/); // defines capturing group for picking up the stuff within parenthesis
                if (output.some((e) => elem_rgx.test(e))){ // TRUE - if any output line consist of "CONFLICT" keyword in it. 
                    //output.push("CONFLICT (add/add): Merge conflict in DESC4")
                    //output.push("CONFLICT (modify/delete): Merge conflict in DESC4")
                    fs.writeFile(path.join(workdirpath, `${dir_name}.json`),{
                        type: "pull",
                        title: `Merge conflict raised pulling ${branchToUpdate} branch`
                    }, (err) => {
                        if (err) reject(`(pushChecker) gitPull-jsonWrite err: ${err}`)
                    })

                    for (var i = 0; i < output.length; i++){
                        if (output[i].match(inbetweenbrackets_rgx) != null) {
                            // form an array of types of conflict occured.. like ['content', 'add/add', 'modify/delete', 'content' etc..]
                            arr.push(output[i].match(inbetweenbrackets_rgx)[1]); 
                        }
                    }
                    if (!arr.every((e) => e === "content")){ // If the array contains anything else than "content" type conflicts. Throw the error with instructions.
                        fs.writeFile(path.join(workdirpath, `${dir_name}.json`), {
                            type: "special",
                            title: `Merge conflict raised pulling ${branchToUpdate} branch`
                        }, (err) => {
                            if (err) reject(`(pushChecker) gitPull-jsonWrite err: ${err}`)
                        })
                    }
                    throw new Error("conflict");
                } else { // if merge was successful in `git pull`
                    await pushToBare(projName, branchToUpdate, username)
                    await removeFromIPFS(curr_majorHash);
                    mainResponse.ipfsHash = await addToIPFS(barerepopath);
                    mainResponse.statusLine = await statusChecker();
                    await rmWorkdir();
                    mainResponse.mergeObj = await getMergeArr();
                    resolve(mainResponse);
                }
            })
        } catch(e) {
            if (e.message === "conflict") {
                await removeFromIPFS(curr_majorHash);
                mainResponse.ipfsHash = await addToIPFS(barerepopath);
                await statusLine()
                mainResponse.statusLine = statLine
                let mainMergeObj = await getMergeArr()
                mainResponse.mergeObj = await getMergeArr();
                resolve({mainMergeObj, mainResponse});
            }
            reject(`(pushchecker) git-pull err: ${e}`)
        }
    })
}