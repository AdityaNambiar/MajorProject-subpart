/**
 * Download the repository (the one with working directory - the normal one)
 * https://localhost:7005/projName.git <- URL. 
 * res.status(200).send(url).
 */
// Misc:
const addToIPFS = require('../utilities/addToIPFS');
const preRouteChecks = require('../utilities/preRouteChecks');
const removeFromIPFS = require('../utilities/removeFromIPFS');
const statusChecker = require('../utilities/statusChecker');
const pushChecker = require('../utilities/pushChecker');
const pushToBare = require('../utilities/pushToBare');
const rmWorkdir = require('../utilities/rmWorkdir');

const { zip } = require('zip-a-folder');
// isomorphic-git related imports and setup
const fs = require('fs');
const git = require('isomorphic-git');
git.plugins.set('fs',fs); // Bring your own file system 

const path = require('path');
const express = require('express');
const router = express.Router();

var projName, workdirpath, curr_majorHash, 
    username, branchToUpdate, projNamepath,
    upstream_branch, majorHash, barerepopath, 
    filenamearr = [], statusLine;

router.post('/downloadRepo', async (req,res) => {
    projName = req.body.projName.replace(/\s/g,'-');
    username = req.body.username.replace(/\s/g,'-');
    curr_majorHash = req.body.majorHash;  // latest
    branchToUpdate = req.body.branchToUpdate.replace(/\s/g,'-');
    upstream_branch = 'origin/master';

    barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git'); 
    workdirpath = path.resolve(__dirname, '..', 'projects', projName, username);
    
    projNamepath = path.resolve(__dirname, '..', 'projects', projName+'.zip');

    try{
        await preRouteChecks(curr_majorHash, projName, username, branchToUpdate)
        .then( async () => {
            await zip(workdirpath, projNamepath);
        })
        .then( async () => {
            await rmWorkdir(projName, username);
        })
        .then ( () => {
            res.download(projNamepath,`${projName}.zip`,(err)=> {
                if (err) {
                    res.status(400).send(`Could not download workdir repo: \n ${err}`);
                } 
            })
        })
    }catch(e){
        res.status(400).send(`main caller err: ${e}`);
    }
})


async function main(projName, workdirpath, curr_majorHash){
    return new Promise ( async (resolve, reject) => {
        try {
            await downloadRepo(workdirpath)
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
                    // Remove old state from IPFS.
                    await removeFromIPFS(curr_majorHash);
                })
                .then( async () => {
                    // Add new state to IPFS.
                    majorHash = await addToIPFS(barerepopath);
                    return majorHash;
                })
                .then( (majorHash) => {
                    console.log("MajorHash (git downloadRepo): ", majorHash);
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

async function downloadRepo(workdirpath) {
    // code to download working dir in .zip format

    
}
module.exports = router;