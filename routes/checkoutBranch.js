/**
 * Checkout to a branch in the current working git repo
 */

// Misc:
import addToIPFS from '../utilities/addToIPFS';
import getFromIPFS from '../utilities/getFromIPFS';

// isomorphic-git related imports and setup
const git = require('isomorphic-git');
git.plugins.set('fs',fs); // Bring your own file system 

const path = require('path');
const fs = require('fs');
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
                    // Store .git's state back to .git state of the project folder stored on IPFS.
                    majorHash = addToIPFS(projLeader,projName); // Store the latest (updated) project hash into majorHash.
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