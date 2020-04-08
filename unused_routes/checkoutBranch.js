/**
 * Checkout to a branch in the current working git repo
 */

// Misc:
const addToIPFS = require('../utilities/addToIPFS');
const getFromIPFS = require('../utilities/getFromIPFS');
const removeFromIPFS = require('../utilities/removeFromIPFS');

// Terminal execution import
const { exec } = require('child_process');

// isomorphic-git related imports and setup
const fs = require('fs');
const git = require('isomorphic-git');
git.plugins.set('fs',fs); // Bring your own file system 

const path = require('path');
const express = require('express');
const router = express.Router();

router.post('/checkoutBranch', async (req,res) => {
    const projLeader = "Aditya" // Hard coded - has to card name or from blockchain?
    var projName = req.body.projName;
    var majorHash = '';
    var branchName = req.body.name;
    majorHash = "QmUicsP9X7onV2cANbFbe5LH9xmiME9XSnscQ6XzEKr2FJ" // hard coded
    try {
        if (!fs.existsSync(path.resolve(__dirname,'..',projName))) {
            await getFromIPFS(majorHash, projLeader) // This should run first and then the below code 
            main(projLeader,projName, majorHash, res, branchName)
        } else {
            main(projLeader,projName, majorHash, res, branchName)
        }
    }catch(e){
        console.log("checkoutBranch main ERR: ",e);
        res.status(400).send(e);
    }
})

async function main(projLeader, projName, majorHash, res, branchName){
    try {
        await git.checkout({
            dir:  path.resolve(__dirname,'..',projName),
            ref: branchName,
        });
        
        var oldmajorHash = majorHash;
        // Store new state of git repo:
        majorHash = await addToIPFS(projLeader,projName);
        // Prevent cluttering IPFS repo by unpinning (and garbage-collect) old states of repo:
        await removeFromIPFS(oldmajorHash, projLeader, projName);
        console.log("Updated MajorHash (git checkout branch): ",majorHash);
        res.status(200).send({projName: projName, majorHash: majorHash});
    }catch(e){
        //console.log("checkoutBranch git ERR: ",e);
        if (e.name == 'ResolveRefError'){
            // For situations when user wants to checkout to a commit hash:
            await exec('git checkout '+branchName, {
                cwd: path.resolve(__dirname,'..',projLeader, projName),
                shell: true,
            }, async (err, stdout, stderr) => {
                if (err) {
                    //console.log("checkoutBranch cli err: \n", err); 
                    res.status(400).send(err);
                }
                else if (stderr) {
                    console.log("checkoutBranch cli stderr: \n", stderr);
                    var oldmajorHash = majorHash;
                    // Store new state of git repo:
                    majorHash = await addToIPFS(projLeader,projName);
                    // Prevent cluttering IPFS repo by unpinning (and garbage-collect) old states of repo:
                    await removeFromIPFS(oldmajorHash, projLeader, projName);
                    console.log("Updated MajorHash (git checkout branch): ",majorHash);
                    res.status(200).send({projName: projName, majorHash: majorHash});
                }
            })
        } else {
            res.status(400).send(e);
        }
    }
}
module.exports = router;