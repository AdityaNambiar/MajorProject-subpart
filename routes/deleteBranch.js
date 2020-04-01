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
    majorHash = "QmX32zevGSsZSSGEGRLNCpkg1TvYiw2rz9jMLqn4VCik7n";
    try {
        if (!fs.existsSync(path.resolve(__dirname,'..',projName))) {
            await getFromIPFS(majorHash, projLeader) // This should run first and then the below code 
            main(projLeader, projName, res, branchName, majorHash)
        } else {
            main(projLeader, projName, res, branchName, majorHash)
        }
    }catch(e){
        console.log("deleteBranch main ERR: ",e);
        res.status(400).send(e);
    }
})
async function main(projLeader, projName, res, branchName, majorHash) {
    try {
        await git.deleteBranch({
            dir:  path.resolve(__dirname,'..',projName),
            ref: branchName
        })

        var oldmajorHash = majorHash;
        // Store new state of git repo:
        majorHash = await addToIPFS(projLeader,projName);
        // Prevent cluttering IPFS repo by unpinning (and garbage-collect) old states of repo:
        await removeFromIPFS(oldmajorHash, projLeader, projName);
        console.log("Updated MajorHash (git branch -d): ",majorHash);
        res.status(200).send({projName: projName, majorHash: majorHash});
    }catch(e){
        console.log("deleteBranch git ERR: ",e);
        res.status(400).send(e);
    }
}
module.exports = router;