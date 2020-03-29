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
    var usermsg = req.body.comm_msg;
    majorHash = '';
    // IPFS work:
    try{
        fs.exists(path.resolve(__dirname,'..',projLeader,projName), async (exists) => 
        { 
            if (!exists) getFromIPFS(majorHash); 
            else {
                // Git work:

                try {
                    let sha = await git.commit({
                        fs,
                        dir:  path.resolve(__dirname,'..',projLeader,projName),
                        message: usermsg,
                        author: {
                            name: authorname,
                            email: authoremail
                        }
                    })
                    console.log("commit hash: \n",sha);
                    // Remove clutter in IPFS by unpinning old git repo state:
                    removeFromIPFS(projLeader,projName);
                    // Store new state of git repo:
                    majorHash = addToIPFS(projLeader,projName);
                    console.log("Updated MajorHash (git commit): ",majorHash);
                    res.status(200).send({message: "Add / Commit successful", data: files});
                }catch(e){
                    console.log("addFile git ERR: ",e);
                    res.status(400).send(e);
                }
            }   
        })
    }catch(err){
        console.log("addFile outer ERR \n",err);
        res.status(400).send(e);
    }
})

module.exports = router;