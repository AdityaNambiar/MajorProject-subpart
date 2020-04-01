/**
 * Add a new branch in git repo:
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


router.post('/downloadRepo', async (req,res) => {
    const projLeader = "Aditya" // Hard coded - has to card name or from blockchain?
    var projName = req.body.projName;
    var majorHash = 'QmWkL3LV3JHJVv4g83TQzeGKpP35cstD241VccNvqn6vA7'; // hard coded
    // IPFS work:
    try{
        await getFromIPFS(majorHash, projLeader)
        res.status(200).send({msg: "Downloaded requested project"}) 
    }catch(e){
        console.log("addBranch outer Err: ",e);
        res.status(400).send(e);
    }
})


module.exports = router;