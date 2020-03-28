/**
 * Checkout to a branch in the current working git repo
 */

// Misc:
const addToIPFS = require('../utilities/addToIPFS');
const getFromIPFS = require('../utilities/getFromIPFS');
const removeFromIPFS = require('../utilities/removeFromIPFS');

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
    majorHash = ""
    try {
        fs.exists(path.join(__dirname, projLeader, projName), async (exists) => 
        { 
            if (!exists) getFromIPFS(majorHash, projLeader); 
            else {
                try {
                    await git.checkout({
                        dir:  path.join(__dirname, projLeader, projName),
                        ref: branchName,
                    });
                    // Prevent cluttering IPFS repo by unpinning old states of repo:
                    removeFromIPFS(projLeader, projName);
                    // Store new state of git repo:
                    majorHash = addToIPFS(projLeader,projName);
                    console.log("Updated MajorHash (git checkout branch): ",majorHash);
                    console.log("Checked out to: ", branchName);
                    res.status(200).send({message: "Branch checkout successful"});
                }catch(e){
                    console.log("checkoutBranch git ERR: ",e);
                    res.status(400).send(e);
                }
            }
        })
    }catch(e){
        console.log("checkoutBranch main ERR: ",e);
        res.status(400).send(e);
    }
})

module.exports = router;