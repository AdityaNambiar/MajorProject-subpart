/**
 * Commit files to git repository.
*/

// Misc:
import addToIPFS from '../utilities/addToIPFS';
import getFromIPFS from '../utilities/getFromIPFS';
import removeFromIPFS from '../utilities/removeFromIPFS';

// isomorphic-git related imports and setup
const git = require('isomorphic-git');
git.plugins.set('fs',fs); // Bring your own file system 

const path = require('path');
const fs = require('fs');
const express = require('express');
const router = express.Router();

router.post('/commitFile', async (req,res) => {
    const projLeader = "Aditya" // Hard coded - has to card name or from blockchain?
    var projName = "";
    var majorHash = '';
    var authorname = 'Aditya';
    var authoremail = 'adi@g.c';
    majorHash = '';
    // IPFS work:
    try{
        fs.exists(path.join(__dirname, projLeader, req.body.projName), async (exists) => 
        { 
            if (!exists) getFromIPFS(majorHash); 
            else {
                // Git work:
                let usermsg = req.body.comm_msg;

                try {
                    let sha = await git.commit({
                        fs,
                        dir:  path.join(__dirname, projLeader, req.body.projName),
                        message: usermsg,
                        author: {
                            name: authorname,
                            email: authoremail
                        }
                    })
                    console.log("commit hash: \n",sha);
                    removeFromIPFS(projLeader,projName);
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