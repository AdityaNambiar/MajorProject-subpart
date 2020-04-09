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
    let projName = req.body.projName;

    await main(projName)

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