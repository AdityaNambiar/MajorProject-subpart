/**
 * Commit files to git repository.
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
    authorname, authoremail, usermsg, 
    filename, buffer;

router.post('/commitFile', async (req,res) => {
    projName = req.body.projName.replace(/\s/g,'-');
    branchToUpdate = req.body.branchToUpdate.replace(/\s/g,'-');
    username = req.body.username.replace(/\s/g,'-');
    curr_majorHash = req.body.majorHash; // latest
    
    authorname = req.body.authorname;
    authoremail = req.body.authoremail;
    usermsg = req.body.comm_msg || `My Commit #${Math.random()}`;
    filename = req.body.filename.replace(/\s/g,'-');
    buffer = req.body.filebuff;


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
})
async function main() {
    return new Promise ( async (resolve, reject) => {
        try {
            await writeFile(projName, username, filename, buffer)
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
                    await removeFromIPFS(curr_majorHash, projName);
                })
                .then( async () => {
                    // Add new state to IPFS.
                    majorHash = await addToIPFS(barerepopath);
                    return majorHash;
                })
                .then( (majorHash) => {
                    console.log("MajorHash (git commitFile): ", majorHash);
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


async function autoCommit(workdirpath, filename, usermsg, authorname, authoremail){
    return new Promise( async (resolve, reject) => {
        try {
            await git.add({
                dir:  workdirpath,
                filepath: filename
            })
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
        } catch(e) {
            reject(`git-init-commit err: ${e}`);
        }
    })
}

async function writeFile(projName, username, filename, buffer) {
    return new Promise( async (resolve, reject) => {
        fs.writeFile(path.resolve(__dirname, '..','projects', projName, username, filename), Buffer.from(buffer), (err) => {
            if (err) reject(` fs write err: ${err} `);
            resolve(true);
        })
    })
}
module.exports = router;