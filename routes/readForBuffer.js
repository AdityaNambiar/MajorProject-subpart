/**
 * readFile and send its Buffer.
 * 
 * 1. Get file name
 * 2. fs.readFile(...path...filename)
 * 3. return the buffer
 */

//MISC:
const addToIPFS = require('../utilities/addToIPFS');
const preRouteChecks = require('../utilities/preRouteChecks');
const removeFromIPFS = require('../utilities/removeFromIPFS');
const statusChecker = require('../utilities/statusChecker');
const pushChecker = require('../utilities/pushChecker');
const pushToBare = require('../utilities/pushToBare');
const rmWorkdir = require('../utilities/rmWorkdir');

const path = require('path');
const fs = require('fs');

const express = require('express');
const router = express.Router();

var projName, workdirpath, curr_majorHash, 
    username, branchToUpdate, buffer, 
    filename, majorHash, barerepopath,
    filepath, filenamearr = [], statusLine,
    data;


router.post('/readForBuffer', async (req, res) => {
    filename = req.body.filename;
    buffer = req.body.filebuff;
    projName = req.body.projName;
    branchToUpdate = req.body.branchToUpdate;
    curr_majorHash = req.body.majorHash; // latest
    
    barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git'); 
    workdirpath = path.resolve(__dirname, '..', 'projects', projName, username);
    filepath = path.resolve(workdirpath,filename)

    try{
        await preRouteChecks(curr_majorHash, projName, username, branchToUpdate)
        .then( async () => {
            let response = await main(projName, curr_majorHash)
            return response;
        })
        .then ( (response) => {
            res.status(200).send(response);
        })
    }catch(e){
        res.status(400).send(`main caller err: ${e}`);
    }
})

async function main(projName, curr_majorHash) {
    return new Promise ( async (resolve, reject) => {
        try {
            data = await readForBuffer(filepath)
            .then ( async () => {
                statusLine = await statusChecker(projName, username);
                return statusLine;
            })
            .then( async () => {
                filenamearr = [];
                filenamearr = await pushChecker(projName, username, branchToUpdate); 
                console.log("pushchecker returned this: \n", filenamearr);
            })
            if (filenamearr.length == 0) {  // if no conflicts only then proceed with cleaning up.
                console.log(`Pushing to branch: ${branchToUpdate}`);
                await pushToBare(projName, branchToUpdate, username)
                .then( async () => {
                    await rmWorkdir(projName, username);
                })
                .then( async () => {
                    // Remove old state from IPFS.
                    await removeFromIPFS(curr_majorHash, projName);
                })
                .then( async () => {
                    // Add new state to IPFS.
                    majorHash = await addToIPFS(barerepopath);
                    return majorHash;
                })
                .then( (majorHash) => {
                    console.log("MajorHash (git readForBuffer): ", majorHash);
                    resolve({projName: projName, majorHash: majorHash, filenamearr: filenamearr, data: data, statusLine: statusLine});
                })
            } else if (filenamearr[0] != "Please solve this merge conflict via CLI"){
                resolve({projName: projName, majorHash: majorHash, filenamearr: filenamearr, data: data, statusLine: statusLine});
            } else {
                resolve({projName: projName, majorHash: curr_majorHash, filenamearr: filenamearr, data: data, statusLine: statusLine});
            }
        } catch(e) {
            reject(`main err: ${e}`);
        }
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