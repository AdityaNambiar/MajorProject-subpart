/**
 * Commit files to git repository.
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


var projName, authorname, authoremail, 
    curr_majorHash, username;
// vars used as global:
var branchToUpdate, files, upstream_branch, barerepopath;

router.post('/commitFile', async (req,res) => {
    projName = req.body.projName;
    authorname = 'Aditya';
    authoremail = 'adi@g.c';
    var i = 0;
    usermsg = req.body.comm_msg || `My Commit ${i++}`;
    curr_majorHash = req.body.majorHash; // latest

    barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git'); 
    workdirpath = path.resolve(__dirname, '..', 'projects', projName, username);

    try{
        await preRouteChecks(curr_majorHash, projName, username)
        .then( async () => {
            let response = await main(projName, workdirpath, branchName, curr_majorHash)
            return response;
        })
        .then ( (response) => {
            res.status(200).send(response);
        })
    }catch(e){
        res.status(400).send(`main caller err: ${e}`);
    }
})
async function main(projLeader, projName, majorHash, res, authorname, authoremail, usermsg) {
    // Git work:
    try {
        let sha = await git.commit({
            fs,
            dir:  path.resolve(__dirname,'..',projName),
            message: usermsg,
            author: {
                name: authorname,
                email: authoremail
            }
        })
        console.log("commit hash: \n",sha);
        
        var oldmajorHash = majorHash;
        // Store new state of git repo:
        majorHash = await addToIPFS(projLeader,projName);
        // Prevent cluttering IPFS repo by unpinning (and garbage-collect) old states of repo:
        await removeFromIPFS(oldmajorHash, projLeader, projName);
        console.log("Updated MajorHash (git commit): ",majorHash);
        res.status(200).send({projName: projName, majorHash: majorHash});
    }catch(e){
        console.log("commitFile git ERR: ",e);
        res.status(400).send(e);
    }
}
module.exports = router;