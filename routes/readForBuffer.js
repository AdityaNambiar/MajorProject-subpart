/**
 * readFile and send its Buffer.
 * 
 * 1. Get file name
 * 2. fs.readFile(...path...filename)
 * 3. return the buffer
 */

const getFromIPFS = require('../utilities/getFromIPFS');

const path = require('path');
const fs = require('fs');

const express = require('express');
const router = express.Router();



var projName, curr_majorHash, username,
    filename, buffer;
// vars used as global:
var branchToUpdate, barerepopath, workdirpath;


router.post('/readForBuffer', async (req, res) => {
    filename = req.body.filename;
    buffer = req.body.filebuff;
    projName = req.body.projName;
    branchToUpdate = req.body.branchToUpdate;
    curr_majorHash = req.body.majorHash; // latest
    branchName = req.body.branchName;
    
    barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git'); 
    workdirpath = path.resolve(__dirname, '..', 'projects', projName, username);
    filepath = path.resolve(workdirpath,filename)
    try{
        await preRouteChecks(curr_majorHash, projName, username, branchToUpdate)
        .then( async () => {
            let response = await main(projName, filename, curr_majorHash)
            return response;
        })
        .then ( (response) => {
            res.status(200).send(response);
        })
    }catch(e){
        res.status(400).send(`main caller err: ${e}`);
    }
})

async function main(projName, filename) {
    return new Promise ( async (resolve, reject) => {
        readForBuffer(filename,workdirpath)
        .then( async () => {
            console.log(`Pushing to branch: ${branchToUpdate}`);
            await pushToBare(projName, branchToUpdate, username);
        })
        .then( async () => {
            await rmWorkdir(projName, username);
        })
        .then( async () => {
            // Remove old state from IPFS.
            await removeFromIPFS(curr_majorHash, projName);
        })
        .then( async () => {
            // Add new state to IPFS.
            let majorHash = await addToIPFS(barerepopath);
            return majorHash;
        })
        .then( (majorHash) => {
            console.log("MajorHash (git addBranch): ", majorHash);
            console.log(` Files: ${files}`);
            resolve({projName: projName, majorHash: majorHash, files: files});
        })
        .catch((e) => {
            reject(`main err: ${e}`);
        })
    })
}

async function readForBuffer(filepath){
    return new Promise( async (resolve, reject) =>{
        console.log(filepath);
        fs.readFile(filepath,(err, data) => {
            if (err) {
                reject('fs readfile err: '+err);
            }
            resolve(data);
        })
    })
}
module.exports = router;