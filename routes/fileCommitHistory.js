/**
 * Show the commit history of file using:
 * `git log -s --pretty=raw ${filename}`
 */

 
// Misc:
const addToIPFS = require('../utilities/addToIPFS');
const getFromIPFS = require('../utilities/getFromIPFS');
const removeFromIPFS = require('../utilities/removeFromIPFS');

// Terminal execution import:
const { exec } = require('child_process');
// isomorphic-git related imports and setup
const fs = require('fs');
const git = require('isomorphic-git');
git.plugins.set('fs',fs); // Bring your own file system 

const path = require('path');
const express = require('express');
const router = express.Router();

router.post('/fileCommitHistory', async (req,res) => {
    projName = req.body.projName;
    branchToUpdate = req.body.branchToUpdate;
    curr_majorHash = req.body.majorHash; // latest
    branchName = req.body.branchName;
    
    barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git'); 
    workdirpath = path.resolve(__dirname, '..', 'projects', projName, username);

    try{
        await preRouteChecks(curr_majorHash, projName, username, branchToUpdate)
        .then( async () => {
            let response = await main(projName, workdirpath, curr_majorHash, branchName)
            return response;
        })
        .then ( (response) => {
            res.status(200).send(response);
        })
    }catch(e){
        res.status(400).send(`main caller err: ${e}`);
    }
});

async function main(projName) {
    return new Promise( async (resolve, reject) => {
        try {
            await exec(`git log -s --pretty=raw ${filename}`, {
                cwd: workdirpath,
                shell: true
            }, (err, stdout, stderr) => {
                if (err) reject(`git-log err: ${err}`);
                if (stderr) reject(`git-log stderr: ${stderr}`);
                console.log(stdout);
            })
            resolve(true);
        } catch(e) {
            reject(e);
        }
    })
}
module.exports = router;