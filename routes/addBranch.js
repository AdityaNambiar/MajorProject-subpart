/**
 * Add a new branch in git repo:
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


router.post('/addBranch', async (req,res) => {
    const projLeader = "Aditya" // Hard coded - has to card name or from blockchain?
    var projName = "";
    var majorHash = '';
    try {
        fs.exists(path.join(__dirname, projLeader, req.body.projName), async (exists) => 
        { 
            if (!exists) getFromIPFS(majorHash, projLeader); 
            else {
                // Git work:
                await git.branch({
                    dir:  path.join(__dirname, projLeader, req.body.projName),
                    ref: req.body.name
                })
                // Prevent cluttering IPFS repo by unpinning old states of repo:
                removeFromIPFS(projLeader, projName);
                // Store new state of git repo:
                majorHash = addToIPFS(projLeader,projName);
                console.log("Updated MajorHash (git branch newbranch): ",majorHash);
                res.status(200).send({message: "Add Branch successful"});
            }
        })
    }catch(e){
        console.log("addBranch outer Err: ",e);
        res.status(400).send(e);
    }
})

module.exports = router;