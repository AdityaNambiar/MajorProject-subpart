
/**
 * Get (Read) list of files in current branch of git repository.
*/

// Misc:
const getFromIPFS = require('../utilities/getFromIPFS');

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
    var majorHash = '';
    // IPFS work:
    try{
        fs.exists(path.resolve(__dirname,'..',projLeader,projName), async (exists) => 
        { 
            if (!exists) getFromIPFS(majorHash, projLeader); 
            else {
                try {
                    let files = await git.listFiles({
                        dir:  path.resolve(__dirname,'..',projLeader,projName),
                        ref: 'HEAD'
                    })
                    console.log("Files on selected branch: ",files);

                    res.status(200).send({message: "Fetch files on current branch (where HEAD ptr is at) successful", data: files});
                }catch(e){
                    console.log("getFiles git ERR: ",e);
                    res.status(400).send(e);
                }
            }
        })
    }catch(e) {
        console.log("getFiles main Err: ", e);
        res.status(400).send(e);
    }
})

module.exports = router;