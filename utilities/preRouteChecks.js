/**
 * If bare repo not exists,
 *      getFromIPFS(ipfshash, projName);
 *      If projName folder not exists,
 *          fs.mkdir(path.resolve('projects',projName)
 * If work dir repo not exists,
 *      clone the bare repo by cloneFromBare(projName, username)
 */



// Misc:
const getFromIPFS = require('../utilities/getFromIPFS');
const cloneFromBare = require('../utilities/cloneFromBare');


// Terminal execution:
const { exec } = require('child_process');

// isomorphic-git related imports and setup
const fs = require('fs');
const git = require('isomorphic-git');
git.plugins.set('fs',fs); // Bring your own file system 

const path = require('path');
const express = require('express');
const router = express.Router();

let projName = 'app';

let barerepopath = path.resolve(__dirname, '..', 'projects');
let workdirpath;
module.exports = async function preRouteChecks(majorHash, projName, username){
    workdirpath = path.resolve(__dirname, '..', 'projects',projName,username);
    return new Promise( async (resolve, reject) => {
        if (!fs.existsSync(barerepopath)) {
            await getFromIPFS(majorHash, projName)
            
        }
    })
}

