/**
 * Return a list of branches from the current working git repo
 */

// Misc:
const addToIPFS = require('../utilities/addToIPFS');
const getFromIPFS = require('../utilities/getFromIPFS');

// isomorphic-git related imports and setup
const fs = require('fs');
const git = require('isomorphic-git');
git.plugins.set('fs',fs); // Bring your own file system 

const path = require('path');
const express = require('express');
const router = express.Router();

router.post('/getBranches', async (req,res) => {
    const projLeader = "Aditya" // Hard coded - has to card name or from blockchain?
    var projName = req.body.projName;
    var majorHash = '';
    majorHash = ""; // Fill in majorHash
    try {
        fs.exists(path.resolve(__dirname,'..',projLeader,projName), async (exists) => 
        { 
            if (!exists) getFromIPFS(majorHash, projLeader); 
            else {
                try{
                    // Git work:
                    let branches = await git.listBranches({
                        dir:  path.resolve(__dirname,'..',projLeader,projName)
                    })
                    majorHash = addToIPFS(projLeader,projName);
                    res.status(200).send(branches);
                }catch(e){
                    console.log("getBranch git err",e);
                    res.status(400).send(e);
                }
            }
        })
    }catch(e){
        console.log("getbranch outer ERR: ",e);
        res.status(400).send(e);
    };
});

module.exports = router;
