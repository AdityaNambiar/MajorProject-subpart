/**
 * A route that just calls removeFromIPFS().
 */

 // Misc:
const addToIPFS = require('../utilities/addToIPFS');
const preRouteChecks = require('../utilities/preRouteChecks');
const removeFromIPFS = require('../utilities/removeFromIPFS');
const statusChecker = require('../utilities/statusChecker');
const pushChecker = require('../utilities/pushChecker');
const pushToBare = require('../utilities/pushToBare');
const rmWorkdir = require('../utilities/rmWorkdir');

// isomorphic-git related imports and setup
const fs = require('fs');

const path = require('path');
const express = require('express');
const router = express.Router();

var projName, workdirpath, curr_majorHash, 
    username, branchToUpdate, barerepopath,
    projNamepath;

router.post('/deleteProj', async (req,res) => {
    projName = req.body.projName.replace(/\s/g,'-');
    username = req.body.username.replace(/\s/g,'-');
    curr_majorHash = req.body.majorHash;  // latest
    branchToUpdate = req.body.branchToUpdate.replace(/\s/g,'-');

    barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git'); 
    workdirpath = path.resolve(__dirname, '..', 'projects', projName, username);
    projNamepath = path.resolve(__dirname, '..', 'projects', projName);

    try{
        await preRouteChecks(curr_majorHash, projName, username, branchToUpdate)
        .then( async () => {
            let response = await main()
            return response;
        })
        .then ( (response) => {
            res.status(200).send(response);
        })
    }catch(e){
        res.status(400).send(`main caller err: ${e}`);
    }
})

async function main(){
    return new Promise ( async (resolve, reject) => {
        await deleteProj()
        .then( async () => {
            // Remove old state from IPFS.
            await removeFromIPFS(curr_majorHash);
        })
        .then( () => {
            console.log("MajorHash (git deleteProj): ", curr_majorHash);
            resolve({projName: projName, majorHash: curr_majorHash});
        })
        .catch ((e) => {
            reject(`main err: ${e}`);
        })
    })
}

async function deleteProj(){
    return new Promise( async (resolve, reject) => {
        try {
            // Delete work dir repo
            fs.rmdir(workdirpath, { 
                recursive: true
            }, (err) => {
                if (err) reject('(deleteProj) workdirdelete err:'+err);
                // Delete projName folder:
                fs.rmdir(projNamepath, { 
                    recursive: true
                }, (err) => {
                    if (err) reject('(deleteProj) projName folder err:'+err);
                    // Delete bare repo:
                    fs.rmdir(barerepopath, { 
                        recursive: true
                    }, (err) => {
                        if (err) reject('(deleteProj) barerepodelete err:'+err);
                        resolve(true);
                    })
                })
            })
        } catch(e) {
            reject(`deleteProj error: ${e}`);
        }  
    }) 
}
module.exports = router