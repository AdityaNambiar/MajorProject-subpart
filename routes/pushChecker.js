/**
 *  - Check between bare repo status and username work dir status
 *  - Called when the Merge Conflict page is loaded. (componentDidMount)
 *  - Utility.
 *      - `git pull barerepo master`
 *      - if conflicts arise, { do the same that you did for mergeFiles route when conflicts arise }.
 *      - if conflicts dont arise, pull will be successful.
 */


// Misc:
const preRouteChecks = require('../utilities/preRouteChecks');

// Terminal execution:
const { exec } = require('child_process');

// isomorphic-git related imports and setup
const fs = require('fs');
const git = require('isomorphic-git');
git.plugins.set('fs',fs); // Bring your own file system 

const path = require('path');
const express = require('express');
const router = express.Router();

let projName, majorHash, barerepopath, workdirpath;

router.post('/pushChecker', async (req,res) => {
    projName = req.body.projName;  
    majorHash = 'QmX4nZGMdwhDCz4NvLrcaVUWJAFL4YzoRS98unY9xx8cLs';
    barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git'); 
    workdirpath = path.resolve(__dirname, '..', 'projects', projName, username);

    try {
        await preRouteChecks(majorHash, projName, username)
        .then( async () => {

        })
    } catch(e) {
        res.status(400).send(`main err: ${e}`);
    }
});

module.exports = router