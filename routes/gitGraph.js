/**
 * Show the 'branch diagram' or 'git log graph' on frontend.
 */

// Misc:
const getFromIPFS = require('../utilities/getFromIPFS');

// Terminal execution import
const { exec } = require('child_process');

// isomorphic-git related imports and setup
const fs = require('fs');
const git = require('isomorphic-git');
git.plugins.set('fs',fs); // Bring your own file system 

const path = require('path');
const express = require('express');
const router = express.Router();


router.post('/gitGraph', async (req,res) => {
    const projLeader = "Aditya"; // Hard coded - has to card name or from blockchain?
    var projName = req.body.projName;
    var majorHash = "QmWkL3LV3JHJVv4g83TQzeGKpP35cstD241VccNvqn6vA7"; // Hard coded.
    // IPFS work:
    try{
        if (!fs.existsSync(path.resolve(__dirname,'..',projName))) {
            await getFromIPFS(majorHash, projLeader) // This should run first and then the below code 
            main(projLeader,projName,res)
        } else {
            main(projLeader,projName,res)
        }
    } catch (e){
        console.log("gitgraph main err: ",e);
        res.status(400).send(e);
    }
});

async function main(projLeader, projName, res){
    try {
        await exec('git log --all --graph --decorate --oneline', {
            cwd: path.resolve(__dirname,'..',projName),
            shell: true,
        }, (err, stdout, stderr) => {
            if (err) console.log("gitgraph err: \n", err);
            if (stderr) console.log("gitgraph stderr: \n", err);
            //console.log("Graph: \n",stdout);
            res.status(200).send(stdout);
        });
    }catch(e){
        console.log("gitgraph (git log) err: ",e);
        res.status(400).send(e);
    }
} 
module.exports = router;