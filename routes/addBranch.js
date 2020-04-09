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

var workdirpath, barerepopath, projectspath, majorHash, 
    authoremail, authorname, buffer, username,
    filename, usermsg, branchToUpdate;


router.post('/addBranch', async (req,res) => {
    projName = req.body.projName;
    branchName = req.body.name;
    majorHash = 'QmNPHq5eQaZvB3pDjxLy2r5se9m17bFw2omtmuwYNnAmqq'; // hard coded
    // IPFS work:
    try{
        if (!fs.existsSync(path.resolve(__dirname,'..','projects',projName+'.git'))) {
            await getFromIPFS(majorHash, projLeader) // Fetch bare repo
            await cloneBare(projName); // Clone the bare repo
            
            
            main(projLeader,projName,branchName,majorHash,res)
        } else {
            main(projLeader,projName,branchName,majorHash,res)
        }
    }catch(e){
        console.log("addBranch outer Err: ",e);
        res.status(400).send(e);
    }
})

async function main(projName, branchName, majorHash, res){
    try {
    // Git work:
    await git.branch({
        dir:  path.resolve(__dirname,'..',projName),
        ref: branchName
    })
    var oldmajorHash = majorHash;
    // Store new state of git repo:
    majorHash = await addToIPFS(projName+'.git');
    // Prevent cluttering IPFS repo by unpinning old states of repo:
    await removeFromIPFS(oldmajorHash, projLeader, projName);
    console.log("Updated MajorHash (git branch newbranch): ",majorHash);
    res.status(200).send({projName: projName, majorHash: majorHash});
    } catch(e) {
        console.log("(git branch newbranch) err: ",e);
        res.status(400).send(e);
    } 
}
module.exports = router;