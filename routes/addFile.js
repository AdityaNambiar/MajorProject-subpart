/**
 * Add files to git repository.
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

router.post('/addFile', async (req,res) => {
    const projLeader = "Aditya" // hard coded - has to card name or from blockchain?
    var projName = req.body.projName || "app";
    var majorHash = '';
    let buffer = req.body.filebuff || "NEW STRING";
    let filename = req.body.filename || "NEW_FILE"; 
    majorHash = 'QmNkhbVEpLa8iLk8M8rzdiorXAR7jpNaRthjoLnFoNneiz'; // hard coded
    // IPFS work:
    try{
        if (!fs.existsSync(path.resolve(__dirname,'..',projName))) {
            await getFromIPFS(majorHash, projLeader) // This should run first and then the below code 
            main(projLeader,projName, majorHash, res, buffer, filename)
        } else {
            main(projLeader,projName, majorHash, res, buffer, filename)
        }
    }catch(err){
        console.log("addFile outer ERR \n",err);
        res.status(400).send(e);
    }
})

async function main(projLeader, projName, majorHash, res, buffer, filename) {
    // Git work:
    fs.writeFileSync(path.resolve(__dirname,'..',projName,filename),Buffer.from(buffer));
    try {
        await git.add({
            dir:  path.resolve(__dirname,'..',projName),
            filepath: filename
        })
        var oldmajorHash = majorHash;
        // Store new state of git repo:
        majorHash = await addToIPFS(projLeader,projName);
        // Prevent cluttering IPFS repo by unpinning (and garbage-collect) old states of repo:
        await removeFromIPFS(oldmajorHash, projLeader, projName);
        console.log("Updated MajorHash (git add): ",majorHash);
        res.status(200).send({projName: projName, majorHash: majorHash});
    }catch(e){
        console.log("addFile git ERR: ",e);
        res.status(400).send(e);
    }
}
module.exports = router;