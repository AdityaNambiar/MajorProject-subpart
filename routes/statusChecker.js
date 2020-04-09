/**
 * 
 * - `git fetch`
 * - `git status`
 *      - Extract the line the "This branch is ahead / behind n commits ...."
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
})

module.exports = router;