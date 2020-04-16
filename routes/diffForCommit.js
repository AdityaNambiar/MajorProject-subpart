/**
 * Get the file names from request.
 * Pass the file / file buffer of both files.
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
git.plugins.set('fs',fs); // Bring your own file system 

const path = require('path');
const express = require('express');
const router = express.Router();

var projName, workdirpath, curr_majorHash, 
    username, branchToUpdate, majorHash, 
    barerepopath, filenamearr = [], statusLine, 
    ref1, diffOutput;

router.post('/diffForCommit', async (req,res) => {
    projName = req.body.projName.replace(/\s/g,'-');
    username = req.body.username.replace(/\s/g,'-');
    branchToUpdate = req.body.branchToUpdate.replace(/\s/g,'-');;
    curr_majorHash = req.body.majorHash;  // latest
    ref1 = req.body.ref1.replace(/\s/g,'-');

    barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git'); 
    workdirpath = path.resolve(__dirname, '..', 'projects', projName, username);

    try{
        await preRouteChecks(curr_majorHash, projName, username)
        .then( async () => {
            let response = await main(projName, workdirpath, curr_majorHash, ref1)
            return response;
        })
        .then ( (response) => {
            res.status(200).send(response);
        })
    }catch(e){
        res.status(400).send(`main caller err: ${e}`);
    }
});

async function main(projName, workdirpath, curr_majorHash, ref1){
    return new Promise ( async (resolve, reject) => {
        try {
             await gitDiffRef(workdirpath, ref1)
            .then ( async (diffOp) => {
                diffOutput = diffOp
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
                    await removeFromIPFS(curr_majorHash, projName);
                })
                .then( async () => {
                    // Add new state to IPFS.
                    majorHash = await addToIPFS(barerepopath);
                    return majorHash;
                })
                .then( (majorHash) => {
                    console.log("MajorHash (git diffForCommit): ", majorHash);
                    resolve({projName: projName, majorHash: majorHash, filenamearr: filenamearr, diffOutput: Buffer.from(diffOutput), statusLine: statusLine});
                })
            } else if (filenamearr[0] != "Please solve this merge conflict via CLI"){
                resolve({projName: projName, majorHash: majorHash, filenamearr: filenamearr, diffOutput: Buffer.from(diffOutput), statusLine: statusLine});
            } else {
                resolve({projName: projName, majorHash: curr_majorHash, filenamearr: filenamearr, diffOutput: Buffer.from(diffOutput), statusLine: statusLine});
            }
        } catch (e) {
            reject(`main err: ${e}`);
        }
    })
}

async function gitDiffRef(workdirpath, ref1) {
    return new Promise(async (resolve, reject) => {
        try {
            await exec(`git log -p --pretty="raw" ${ref1}`, {
                cwd: workdirpath,
                shell: true
            }, (err, stdout, stderr) => {
                if (err) reject(`git-diffcommitrefs err: ${err}`);
                if (stderr) reject(`git-diffcommitrefs stderr: ${stderr}`);
                console.log(stdout);

                let a = stdout.split("diff --git");
                for (let i = 1; i < a.length; i++) {
                    a[i] = "diff --git" + a[i];
                }
                a.shift();
                console.log(a.join('\n'));
                resolve(a.join('\n'))
            })
        } catch(e) {
            reject(`git-diffrefs err: ${e}`)
        } 
    })
}

module.exports = router;