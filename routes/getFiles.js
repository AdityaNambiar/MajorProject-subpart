
/**
 * Get (Read) list of files in current branch of git repository.
 * (No changes in .git/ folder - confirmed)
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

router.post('/getFiles', async (req,res) => {
    const projLeader = "Aditya" // Hard coded - has to card name or from blockchain?
    var projName = req.body.projName;
    var majorHash = req.body.majorHash; // hard coded
    var branchName = req.body.name;
    // IPFS work:
    try{
        console.log(fs.existsSync(path.resolve(__dirname,'..',projName)));
        if (!fs.existsSync(path.resolve(__dirname,'..',projName))) {
            await getFromIPFS(majorHash, projLeader) // This should run first and then the below code 
            main(projLeader, projName, res, majorHash, branchName)
        } else {
            main(projLeader, projName, res, majorHash, branchName)
        }
    }catch(e) {
        console.log("getFiles main err: ", e);
        res.status(400).send(e);
    }
})

async function main(projLeader, projName, res, majorHash, branchName){
    try {
        let files = await git.listFiles({
            dir:  path.resolve(__dirname,'..',projName),
            ref:  `${branchName}`
        })
        var oldmajorHash = majorHash;
        // Store new state of git repo:
        majorHash = await addToIPFS(projLeader,projName);
        // Prevent cluttering IPFS repo by unpinning old states of repo:
        await removeFromIPFS(oldmajorHash, projLeader, projName);
        console.log("Updated MajorHash (git ls-files): ",majorHash);
        res.status(200).send({projName: projName, majorHash: majorHash, files: files});
    }catch(e){
        console.log("getFiles git ERR: ",e);
        if (e.name == 'ResolveRefError'){
            // For situations when user wants to checkout to a commit hash:
            await exec('git ls-files', {
                cwd: path.resolve(__dirname,'..',projLeader, projName),
                shell: true,
            }, async (err, stdout, stderr) => {
                if (err) {
                    console.log("getFiles cli err: \n", err); 
                    res.status(400).send(err);
                }
                else if (stderr) {
                    console.log("getFiles cli stderr: \n", stderr);
                    res.status(400).send(stderr);
                }
                else if(stdout){
                    console.log("getFiles cli : \n", stdout);
                    var filesarr = []
                    filesarr = stdout.trim().split("\n");
                    var oldmajorHash = majorHash;
                    // Store new state of git repo:
                    majorHash = await addToIPFS(projLeader,projName);
                    // Prevent cluttering IPFS repo by unpinning (and garbage-collect) old states of repo:
                    await removeFromIPFS(oldmajorHash, projLeader, projName);
                    console.log("Updated MajorHash (git ls-files) ",majorHash);
                    res.status(200).send({projName: projName, majorHash: majorHash, files: filesarr});
                }
                else{

                }
            })
        } else {
            res.status(400).send(e);
        }
    }
}
module.exports = router;