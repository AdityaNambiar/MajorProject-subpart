/**
 * Add files to git repository.
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

router.post('/addFile', async (req,res) => {
    const projLeader = "Aditya" // Hard coded - has to card name or from blockchain?
    var projName = req.body.projName;
    var majorHash = '';
    majorHash = 'QmPkJRJzcvXApgMoJBsWx2Vi4HdPUxmtpkoBNPc5SPVQoQ';
    // IPFS work:
    try{
        fs.exists(path.join(__dirname, projLeader, projName), async (exists) => 
        { 
            if (!exists) getFromIPFS(majorHash); 
            else {
                // Git work:
                let buffer = req.body.filebuff;
                let filename = req.body.filename;

                fs.writeFileSync(path.join(__dirname, projLeader, projName,filename),Buffer.from(buffer));
                try {
                    let files = await git.add({
                        dir:  path.join(__dirname, projLeader, req.body.projName),
                        filepath: filename
                    })
                    console.log(`File added is -> ${filename}`);
                    removeFromIPFS(projLeader, projName);
                    majorHash = addToIPFS(projLeader,projName);
                    console.log("Updated MajorHash (git add): ",majorHash);
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