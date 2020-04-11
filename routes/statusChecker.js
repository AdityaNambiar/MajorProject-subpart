/**
 * 
 * - `git fetch`
 * - `git status`
 *      - Extract the line the "This branch is ahead / behind n commits ...."
 *      - Three different lines are:
 *          -- (default) Your branch is up to date with 'origin/master'.
 *          -- Your branch and 'origin/master' have diverged,
 *          -- Your branch is ahead of 'origin/master'
 *          -- Your branch is behind 'origin/master' by 1 commit, 
 */


// Misc:
const addToIPFS = require('../utilities/addToIPFS');
const preRouteChecks = require('../utilities/preRouteChecks');
const pushToBare = require('../utilities/pushToBare');

// Terminal execution:
const { exec } = require('child_process');

// isomorphic-git related imports and setup
const fs = require('fs');
const git = require('isomorphic-git');
git.plugins.set('fs',fs); // Bring your own file system 

const path = require('path');
const express = require('express');
const router = express.Router();


router.post('/statusChecker', async (req,res) => {
    try{
        await preRouteChecks(majorHash, projName, username)
        .then( async () => {
            await main(projName, workdirpath, branchName, majorHash, branchToUpdate)
        })
        .then ( (response) => {
            res.status(200).send(response);
        })
    }catch(e){
        res.status(400).send(`main err: ${e}`);
    }
})

module.exports = router;