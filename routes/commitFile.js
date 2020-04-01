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

router.post('/commitFile', async (req,res) => {
    const projLeader = "Aditya" // Hard coded - has to card name or from blockchain?
    var projName = req.body.projName;
    var majorHash = '';
    var authorname = 'Aditya';
    var authoremail = 'adi@g.c';
    var i = 0;
    var usermsg = req.body.comm_msg || `My Commit ${i++}`;
    majorHash = 'QmeUkGcBj7vCsPzeYVVdgRKdf64vMZpjUjgpaFAU7jqeGt'; // hard coded

    // IPFS work:
    try{
        if (!fs.existsSync(path.resolve(__dirname,'..',projName))) {
            await getFromIPFS(majorHash, projLeader) // This should run first and then the below code 
            main(projLeader,projName, majorHash, res, authorname, authoremail, usermsg)
        } else {
            main(projLeader,projName, majorHash, res, authorname, authoremail, usermsg)
        }
    }catch(err){
        console.log("commitFile main ERR \n",err);
        res.status(400).send(e);
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