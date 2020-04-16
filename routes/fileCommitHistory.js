/**
 * Show the commit history of file using:
 * `git log -s --pretty=raw ${filename}`
 */

 
// Misc:
const addToIPFS = require('../utilities/addToIPFS');
const preRouteChecks = require('../utilities/preRouteChecks');
const removeFromIPFS = require('../utilities/removeFromIPFS');
const statusChecker = require('../utilities/statusChecker');
const pushChecker = require('../utilities/pushChecker');
const pushToBare = require('../utilities/pushToBare');
const rmWorkdir = require('../utilities/rmWorkdir');

// Terminal execution import:
const { exec } = require('child_process');
// isomorphic-git related imports and setup
const fs = require('fs');
const git = require('isomorphic-git');
git.plugins.set('fs',fs); // Bring your own file system 

const path = require('path');
const express = require('express');
const router = express.Router();


var projName, workdirpath, curr_majorHash, 
    username, branchToUpdate, majorHash, 
    barerepopath, filenamearr, statusLine,
    commitsObj, filename;

router.post('/fileCommitHistory', async (req,res) => {
    projName = req.body.projName.replace(/\s/g,'-');
    branchToUpdate = req.body.branchToUpdate.replace(/\s/g,'-');
    username = req.body.username.replace(/\s/g,'-');
    curr_majorHash = req.body.majorHash; // latest
    filename = req.body.filename;
    
    barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git'); 
    workdirpath = path.resolve(__dirname, '..', 'projects', projName, username);

    try{
        await preRouteChecks(curr_majorHash, projName, username, branchToUpdate)
        .then( async () => {
            let response = await main(projName, workdirpath, curr_majorHash, filename)
            return response;
        })
        .then ( (response) => {
            res.status(200).send(response);
        })
    }catch(e){
        res.status(400).send(`main caller err: ${e}`);
    }
});

async function main(projName, workdirpath, curr_majorHash, filename) {
    return new Promise ( async (resolve, reject) => {
        try {
            await fileCommitHistory(workdirpath, filename)
            .then ( async (cObj) => {
                commitsObj = cObj;
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
                    console.log("MajorHash (git fileCommitHistory): ", majorHash);
                    resolve({projName: projName, majorHash: majorHash, filenamearr: filenamearr, commitsObj:commitsObj, statusLine: statusLine});
                })
            } else if (filenamearr[0] != "Please solve this merge conflict via CLI"){
                resolve({projName: projName, majorHash: majorHash, filenamearr: filenamearr, commitsObj:commitsObj, statusLine: statusLine});
            } else {
                resolve({projName: projName, majorHash: curr_majorHash, filenamearr: filenamearr, commitsObj:commitsObj, statusLine: statusLine});
            }
        } catch (e) {
            reject(`main err: ${e}`);
        }
    })
}

async function fileCommitHistory(workdirpath, filename) {
    return new Promise( async (resolve, reject) => {
        try {
            await exec(`git log --pretty=raw ${filename}`, {
                cwd: workdirpath,
                shell: true
            }, (err, stdout, stderr) => {
                if (err) reject(`git-log err: ${err}`);
                if (stderr) reject(`git-log stderr: ${stderr}`);
                
                let a = stdout.split("commit ");
                for (let i = 1; i < a.length; i++) {
                    a[i] = "commit " + a[i];
                }
                a.shift();

                var b;
                for (var i = 0; i < a.length; i++) {
                    b = a[i].trim().split('\n');
                    var commitobj = {
                        commitHash: '', 
                        parentHashArr: [], 
                        author_name: '',
                        author_timestamp: '',
                        committer_name: '',
                        committer_timestamp: '',
                        commit_msg: ''
                    }
                    b.forEach( (e,i) => {
                        switch(e.split(' ')[0]){
                        case "commit": commitobj.commitHash = e.split(' ')[1]; break;
                        case "parent": commitobj.parentHashArr.push(e.split(' ')[1]); break;
                        case "author": 
                            commitobj.author_name = e.split(' ')[1];
                            commitobj.author_timestamp = new Date(e.split(' ')[3]*1000).toLocaleString('en-US', { hour12: false });;
                            break;

                        case "committer": 
                            commitobj.committer_name = e.split(' ')[1];
                            commitobj.committer_timestamp = new Date(e.split(' ')[3]*1000).toLocaleString('en-US', { hour12: false });;
                            break;
                        }
                        if (i == b.length - 1) {
                        commitobj.commit_msg = e.trim();
                        }
                    })
                    a[i] = commitobj;
                }
                // let diffPatch = stdout.split("diff --git");
                // for (let i = 1; i < diffPatch.length; i++) {
                //     diffPatch[i] = "diff --git" + diffPatch[i];
                // }
                // diffPatch.shift();
                // commitsNDiffObj = [a,diffPatch];
                // console.log(commitsNDiffObj);
                
                resolve(a);
            })
        } catch(e) {
            reject(e);
        }
    })
}
module.exports = router;