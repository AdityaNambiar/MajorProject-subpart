/**
 * Remove a branch from the current working git repo
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

router.post('/deleteBranch', async (req,res) => {
    const projLeader = "Aditya" // Hard coded - has to card name or from blockchain?
    var projName = req.body.projName;
    var branchName = req.body.name;
    var majorHash = "";
    majorHash = "";
    try {
        fs.exists(path.join(__dirname, projLeader, projName), async (exists) => 
        { 
            if (!exists) getFromIPFS(majorHash); 
            else {
                try {
                    await git.deleteBranch({
                        dir:  path.join(__dirname, projLeader, projName),
                        ref: branchName
                    })
                    // Unpin old majorHash to prevent clutter:
                    removeFromIPFS(projLeader,projName);
                    // Store new state of repository:
                    majorHash = addToIPFS(projLeader,projName);
                    console.log("Updated majorHash (deleted branch): ", majorHash);
                    res.status(200).send({message: "Delete Branch successful"});
                }catch(e){
                    console.log("deleteBranch git ERR: ",e);
                    res.status(400).send(e);
                }
            }
        })
    }catch(e){
        console.log("deleteBranch outer ERR: ",e);
        res.status(400).send(e);
    }
})

module.exports = router;