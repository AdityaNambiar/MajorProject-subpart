/**
 * Fetch the filebuffobj from provided username+timestamp - i.e. workdirpath (unmerged workdir) 
 */

//MISC:
const addToIPFS = require('../utilities/addToIPFS');
const preRouteChecks = require('../utilities/preRouteChecks');
const removeFromIPFS = require('../utilities/removeFromIPFS');
const statusChecker = require('../utilities/statusChecker');
const pushChecker = require('../utilities/pushChecker');
const pushToBare = require('../utilities/pushToBare');
const rmWorkdir = require('../utilities/rmWorkdir');

const path = require('path');
const fs = require('fs');

const express = require('express');
const router = express.Router();

var projName, workdirpath, curr_majorHash, 
    username, branchToUpdate, buffer, 
    filename, majorHash, barerepopath,
    filepath, filenamearr = [], statusLine;

router.post('/readMerge', async (req, res) => {
    filename = req.body.filename;
    projName = req.body.projName.replace(/\s/g,'-');
    branchToUpdate = req.body.branchToUpdate.replace(/\s/g,'-');
    curr_majorHash = req.body.majorHash; // latest
    username = req.body.username.replace(/\s/g,'-');
    
    barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git'); 
    workdirpath = path.resolve(__dirname, '..', 'projects', projName, username);
    filepath = path.resolve(workdirpath,filename)

    try{
        await preRouteChecks(curr_majorHash, projName, username, branchToUpdate)
        .then( async () => {
            let response = await main();
            return response;
        })
        .then ( (response) => {
            res.status(200).send(response);
        })
    }catch(e){
        res.status(400).send(`main caller err: ${e}`);
    }
})

async function main() {
    return new Promise ( async (resolve, reject) => {
        try {
            await checkUnmergedFiles(filepath)
            .then ( async (data) => {
                buffer = data
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
                    console.log("MajorHash (git readFile): ", majorHash);
                    resolve({projName: projName, majorHash: majorHash, filenamearr: filenamearr, buffer: buffer, statusLine: statusLine});
                })
            } else if (filenamearr[0] != "Please solve this merge conflict via CLI"){
                resolve({projName: projName, majorHash: majorHash, filenamearr: filenamearr, buffer: buffer, statusLine: statusLine});
            } else {
                resolve({projName: projName, majorHash: curr_majorHash, filenamearr: filenamearr, buffer: buffer, statusLine: statusLine});
            }
        } catch(e) {
            reject(`main err: ${e}`);
        }
    })
}

async function checkUnmergedFiles(workdirpath) {
    return new Promise ( async (resolve, reject) => {
        operations(workdirpath)
        .then( (filebuffobj) => {
            resolve(filebuffobj);
        })
        .catch((e) => {
            reject(`main err: ${e}`);
        })
    })
}

async function operations(workdirpath){
    var filename_arr = [];
    var filebuffobj = {};
    return new Promise( async (resolve, reject) => {
        try {
                await exec(`git diff --name-only --diff-filter=U`, {
                    cwd: workdirpath,
                    shell: true
                }, async (err, stdout, stderr) => {
                    if (err) reject(`unmerged file show cli err: ${err}`)
                    if (stderr) reject(`unmerged file show cli stderr: ${stderr}`)
                    filename_arr = [];
                    filename_arr = stdout.trim().split('\n');
                    console.log('filename arr: \n', filename_arr);
                    for (var i = 0; i < filename_arr.length; i++) {
                        filebuffobj[filename_arr[i]] = await readForBuffer(workdirpath, filename_arr[i]);
                    }
                    resolve(filebuffobj);
                })
        } catch(e) {
            reject(`(checkUnmergedFiles) git-diff err: ${e}`)
        }
    })
}

async function readForBuffer(workdirpath, filename){
    return new Promise( async (resolve, reject) =>{
        // Specify this as 2nd parameter: {encoding: 'utf-8'} - to prevent getting a buffer.
        fs.readFile(path.resolve(workdirpath, filename),(err, data) => {
            if (err) {
                reject('(checkUnmergedFiles) fs readfile err: '+err);
            }
            resolve(data);
        })
    })
}

module.exports = router