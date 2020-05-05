/**
 * Return a merge arr of the form:
 *    merge_arr = [
                    {  
                        'mergeid': username+timestamp, (dir_list[i])
                        'file': filename_list
                    },
                    {
                        'mergeid': username+timestamp,
                        'file': filename_list
                    }
               ]
 * 
 */

// Misc:
const addToIPFS = require('../utilities/addToIPFS');
const preRouteChecks = require('../utilities/preRouteChecks');
const removeFromIPFS = require('../utilities/removeFromIPFS');
const statusChecker = require('../utilities/statusChecker');
const pushChecker = require('../utilities/pushChecker');
const pushToBare = require('../utilities/pushToBare');
const rmWorkdir = require('../utilities/rmWorkdir');

// isomorphic-git related imports and setup
const fs = require('fs');
const git = require('isomorphic-git'); 

const path = require('path');
const express = require('express');
const router = express.Router();

var projName, workdirpath, curr_majorHash, 
    username, branchToUpdate, majorHash, 
    barerepopath, filenamearr, statusLine,
    branchlist=[];

router.post('/scanDir', async (req,res) => {
    projName = req.body.projName.replace(/\s/g,'-');
    username = req.body.username.replace(/\s/g,'-');
    curr_majorHash = req.body.majorHash;  // latest
    branchToUpdate = req.body.branchToUpdate.replace(/\s/g,'-');

    barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git'); 
    
    workdirpath = path.resolve(__dirname, '..', 'projects', projName, username);

    try{
        await preRouteChecks(curr_majorHash, projName, username, branchToUpdate)
        .then( async () => {
            let response = await main()
            return response;
        })
        .then ( (response) => {
            res.status(200).send(response);
        })
    }catch(e){
        res.status(400).send(`main caller err: ${e}`);
    }
});

async function main(){ 
    return new Promise ( async (resolve, reject) => {
        try {
            await scanDir(branchNamepath)
            .then ( async (bList) => {
                branchlist = bList
                statusLine = await statusChecker(projName, username);
                return statusLine;
            })
            .then( async () => {
                filenamearr = [];
                filenamearr = await pushChecker(projName, username, branchToUpdate); 
                console.log("pushchecker returned this: \n", filenamearr);
            })
            if (filenamearr.length == 0) {  // if no conflicts only then proceed with cleaning up.
                console.log(`Pushing to branch: ${branchToUpdate}`);
                await pushToBare(projName, branchToUpdate, username)
                .then( async () => {
                await rmWorkdir(projName, username);
                })
                .then( async () => {
                    // Remove old state from IPFS.
                    await removeFromIPFS(curr_majorHash);
                })
                .then( async () => {
                    // Add new state to IPFS.
                    majorHash = await addToIPFS(barerepopath);
                    return majorHash;
                })
                .then( (majorHash) => {
                    console.log("MajorHash (git getBranches): ", majorHash);
                    resolve({projName: projName, majorHash: majorHash, filenamearr: filenamearr, branchlist: branchlist, statusLine: statusLine});
                })
            } else if (filenamearr[0] != "Please solve this merge conflict via CLI"){
                resolve({projName: projName, majorHash: majorHash, filenamearr: filenamearr, branchlist: branchlist, statusLine: statusLine});
            } else {
                resolve({projName: projName, majorHash: curr_majorHash, filenamearr: filenamearr, branchlist: branchlist, statusLine: statusLine});
            }
        } catch (e) {
            reject(`main err: ${e}`);
        }
    })
}



async function scanDir(branchNamepath) {

    return new Promise ( async (resolve, reject) => {
        scan(branchNamepath)
        .then( async (dir_list) => {
            let merge_arr = await formMergeArr(dir_list, branchNamepath);
            return merge_arr;
        })
        .then( (m_arr) => {
            resolve(m_arr);
        })
        .catch((e) => {
            reject(`main err: ${e}`);
        })
    })
}

async function scan(branchNamepath){
    return new Promise( async (resolve, reject) => {
        try {
            fs.readdir(branchNamepath,(err,files)=>{
                if (err) reject(`readdir err: ${err}`)
                resolve(files);
            })
        } catch(e) {
            reject(`(scan) fs.readdir err: ${e}`)
        }
    })
}

async function formMergeArr(dir_list, branchNamepath){
    var mergearr = []
    var obj = { 
        'mergeid':'',
        'filenamelist': [] 
    }
    return new Promise( async (resolve, reject) => {
        try {
            for (var i = 0; i < dir_list.length; i++) {
                obj.mergeid = dir_list[i];
                obj.filenamelist = await gitDiff(path.join(branchNamepath, dir_list[i]));
                mergearr.push(obj)
            }
            resolve(mergearr);
        } catch(e) {
            reject(`formMergeArr err: ${e}`)
        }
    })
}

async function gitDiff(workdirpath) {
    return new Promise( async (resolve, reject) => {
        try {
            var filename_list = [];
            await exec(`git diff --name-only --diff-filter=U`, {
                cwd: workdirpath,
                shell: true
            }, async (err, stdout, stderr) => {
                if (err) reject(`(gitDiff) unmerged file show cli err: ${err}`)
                if (stderr) reject(`(gitDiff) unmerged file show cli stderr: ${stderr}`)
                filename_list = [];
                filename_list = stdout.trim().split('\n');
                console.log('filename list: \n', filename_list);
                resolve(filename_list);
            })
        } catch(e) {
            reject(`(gitDiff) git-diff err: ${e}`)
        }
    })
}

module.exports = router