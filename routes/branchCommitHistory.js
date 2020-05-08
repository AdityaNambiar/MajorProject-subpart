/**
 * Get the file names from request.
 * Pass the file / file buffer of both files.
 */

 
// Misc:
const addToIPFS = require('../utilities/addToIPFS');
const getFromIPFS = require('../utilities/getFromIPFS');
const removeFromIPFS = require('../utilities/removeFromIPFS');
const cloneBare = require('../utilities/cloneBare');


// isomorphic-git related imports and setup
const fs = require('fs');
const git = require('isomorphic-git');
git.plugins.set('fs',fs); // Bring your own file system 

const path = require('path');
const express = require('express');
const router = express.Router();

router.post('/branchCommitHistory', async (req,res) => {
    let projName = req.body.projName;

    await main(projName)

});

async function main(projName) {
    return new Promise( async (resolve, reject) => {
        try {
            await git.log({
                fs,
                dir: path.resolve(__dirname, '..', 'projects', projName)
            })
            resolve(true);
        } catch(e) {
            reject(e);
        }
    })
}
module.exports = router;