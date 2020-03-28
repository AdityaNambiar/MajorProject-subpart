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


router.post('/addBranch', async (req,res) => {
    const projLeader = "Aditya" // Hard coded - has to card name or from blockchain?
    var projName = "";
    var majorHash = '';
    try {
        fs.exists(path.join(__dirname, projLeader, req.body.projName), async (exists) => 
        { 
            if (!exists) getFromIPFS(majorHash); 
            else {
                // Git work:
                await git.branch({
                    dir:  path.join(__dirname, projLeader, req.body.projName),
                    ref: req.body.name
                })
                addToIPFS(projLeader,projName);
                res.status(200).send({message: "Add Branch successful"});
            }
        })
    }catch(e){
        console.log("addBranch outer Err: ",e);
        res.status(400).send(e);
    }
})

module.exports = router;