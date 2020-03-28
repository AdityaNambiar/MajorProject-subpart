/**
 * Show the 'branch diagram' or 'git log graph' on frontend.
 */

// Misc:
const getFromIPFS = require('../utilities/getFromIPFS');

// Terminal execution import
const { exec, spawn, spawnSync, execSync } = require('child_process');

// isomorphic-git related imports and setup
const fs = require('fs');
const git = require('isomorphic-git');
git.plugins.set('fs',fs); // Bring your own file system 

const path = require('path');
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
            if (!exists) getFromIPFS(majorHash, projLeader); 
            else {
                try {
                    exec('git log --all --graph --decorate --oneline', {
                        cwd: path.join(__dirname, projLeader,projName),
                        shell: true,
                    }, (err, stdout, stderr) => {
                        if (err) console.log("gitgraph err: \n", err);
                        if (stderr) console.log("gitgraph stderr: \n", err);
                        console.log(stdout);
                        res.status(200).send(stdout);
                    });
                }catch(e){
                    console.log("gitgraph (git log) err: ",e);
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