/**
 * readFile and send its Buffer.
 * 
 * 1. Get file name
 * 2. fs.readFile(...path...filename)
 * 3. return the buffer
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
const { exec } = require('child_process');

// isomorphic-git related imports and setup
const git = require('isomorphic-git'); 

const express = require('express');
const router = express.Router();

var projName, workdirpath, curr_majorHash, 
    username, branchToUpdate, filename, 
    majorHash, barerepopath, filepath, 
    filenamearr = [], statusLine, usermsg,
    authorname, authoremail;


router.post('/deleteFile', async (req, res) => {
    projName = req.body.projName.replace(/\s/g,'-');
    branchToUpdate = req.body.branchToUpdate.replace(/\s/g,'-');
    username = req.body.username.replace(/\s/g,'-');
    curr_majorHash = req.body.majorHash; // latest
    filename = req.body.filename;
    
    authorname = req.body.authorname;
    authoremail = req.body.authoremail;
    usermsg = req.body.usermsg || `My Commit #${Math.random()}`;
    filename = req.body.filename.replace(/\s/g,'-');

    barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git'); 
    workdirpath = path.resolve(__dirname, '..', 'projects', projName, username);
    filepath = path.resolve(workdirpath,filename)

    try{
        await preRouteChecks(curr_majorHash, projName, username, branchToUpdate)
        .then( async () => {
            let response = await main(projName, curr_majorHash)
            return response;
        })
        .then ( (response) => {
            res.status(200).send(response);
        })
    }catch(e){
        res.status(400).send(`main caller err: ${e}`);
    }
})

async function main(projName, curr_majorHash) {
    return new Promise ( async (resolve, reject) => {
        try {
            await deleteFile(filepath)
            .then( async () => {
                await autoCommit(workdirpath,filename, usermsg, authorname, authoremail);
            })
            .then ( async () => {
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
                    console.log("MajorHash (git deleteFile): ", majorHash);
                    resolve({projName: projName, majorHash: majorHash, filenamearr: filenamearr, statusLine: statusLine});
                })
            } else if (filenamearr[0] != "Please solve this merge conflict via CLI"){
                resolve({projName: projName, majorHash: majorHash, filenamearr: filenamearr, statusLine: statusLine});
            } else {
                resolve({projName: projName, majorHash: curr_majorHash, filenamearr: filenamearr, statusLine: statusLine});
            }
        } catch(e) {
            reject(`main err: ${e}`);
        }
    })
}

async function deleteFile(filepath){
    return new Promise( async (resolve, reject) =>{
        console.log(filepath);
        fs.unlink(filepath,(err) => {
            if (err) {
                reject('fs deletefile err: '+err);
            }
            resolve(true);
        })
    })
}


async function autoCommit(workdirpath, filename, usermsg, authorname, authoremail){
    return new Promise( async (resolve, reject) => {
        try {
            await exec(`git add .`, {
                cwd: workdirpath,
                shell: true
            }, async (err, stdout, stderr) => {
                if (err) reject(` git-add cli err: ${err}`);
                if (stderr) reject(` git-add cli stderr: ${err}`);
                let sha = await git.commit({
                    fs,
                    dir:  workdirpath,
                    message: usermsg,
                    author: {
                        name: authorname,
                        email: authoremail
                    }
                })
                console.log("commit hash: \n",sha);
                resolve(true);
            })
        } catch(e) {
            reject(`git-commit err: ${e}`);
        }
    })
}
module.exports = router;