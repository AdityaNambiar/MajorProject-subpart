/**
 * Show the 'branch diagram' or 'git log graph' on frontend.
 */

// Misc:
import getFromIPFS from '../utilities/getFromIPFS';

// isomorphic-git related imports and setup
const git = require('isomorphic-git');
git.plugins.set('fs',fs); // Bring your own file system 

const path = require('path');
const fs = require('fs');
const express = require('express');
const router = express.Router();

router.post('/gitGraph', (req,res) => {
    const projLeader = "Aditya" // Hard coded - has to card name or from blockchain?
    var projName = req.body.projName;
    var majorHash = '';
    // IPFS work:
    try{
        fs.exists(path.join(__dirname, projLeader, projName), async (exists) => 
        { 
            if (!exists) getFromIPFS(majorHash); 
            else {
                try {
                    var execout = execSync('git log --all --graph --decorate --oneline', {
                        cwd: path.join(__dirname, projLeader,projName),
                        shell: true,
                    });
                    console.log(execout);
                    res.status(200).send(execout);
                }catch(e){
                    console.log("gitgraph err: ",e);
                    res.status(400).send(e);
                }
            }
        })
    } catch (e){
        console.log("gitgraph main err: ",e);
        res.status(400).send(e);
    }
});

module.exports = router;