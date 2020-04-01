/**
 * Return a list of branches from the current working git repo
 * (No changes in .git/ folder - confirmed)
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

router.post('/getBranches', async (req,res) => {
    const projLeader = "Aditya" // Hard coded - has to card name or from blockchain?
    var projName = req.body.projName;
    var majorHash = '';
    majorHash = req.body.majorHash; // Fill in majorHash
    try {
        if (!fs.existsSync(path.resolve(__dirname,'..',projName))) {
            await getFromIPFS(majorHash, projLeader) // This should run first and then the below code 
            main(projLeader, projName, res, majorHash)
        } else {
            main(projLeader, projName, res, majorHash)
        }
    }catch(e){
        console.log("getbranch main ERR: ",e);
        res.status(400).send(e);
    };
});

async function main(projLeader, projName, res, majorHash){ 
    try{
        // Git work:
        let branches = await git.listBranches({
            dir:  path.resolve(__dirname,'..',projName)
        })

        var oldmajorHash = majorHash;
        // Store new state of git repo:
        majorHash = await addToIPFS(projLeader,projName);
        // Prevent cluttering IPFS repo by unpinning old states of repo:
        await removeFromIPFS(oldmajorHash, projLeader, projName);
        console.log("Updated MajorHash (git branch): ",majorHash);
        res.status(200).send({projName: projName, majorHash: majorHash, branches: branches});
    }catch(e){
        console.log("getBranch git err",e);
        res.status(400).send(e);
    }
}
module.exports = router;
