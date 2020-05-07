/**
 * readFile and send its Buffer.
 * 
 * 1. Get file name
 * 2. fs.readFile(...path...filename)
 * 3. return the buffer
 */

//MISC:
const preRouteChecks = require('../utilities/preRouteChecks');
const pushChecker = require('../utilities/pushChecker');
const rmWorkdir = require('../utilities/rmWorkdir');

const path = require('path');
const fs = require('fs');

const express = require('express');
const router = express.Router();


router.post('/readFile', async (req, res) => {
    var projName = req.body.projName;
    var branchToUpdate = req.body.branchToUpdate;
    var curr_majorHash = req.body.majorHash; // latest
    var username = req.body.username;
    var filename = req.body.filename;
    
    var timestamp = Date.now();

    var barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName + '.git');
    var workdirpath = path.resolve(__dirname, '..', 'projects', projName, branchToUpdate, username + timestamp);
    var filepath = path.resolve(workdirpath, filename)

    try {
        await preRouteChecks(curr_majorHash, projName, username, timestamp, branchToUpdate)
        let response = await main(projName, timestamp, barerepopath, filepath,
                                    workdirpath, curr_majorHash, url)
        res.status(200).send(response);
    } catch (err) {
        console.log(err);
        res.status(400).send(`(readFile) err ${err.name} :- ${err.message}`);
    }
})


async function main(projName, timestamp, barerepopath, filepath,
    workdirpath, curr_majorHash, url) {
    try {
        let buffer = await readForBuffer(filepath)
        const responseobj = await pushChecker(barerepopath, workdirpath, timestamp, curr_majorHash);
        console.log("pushchecker returned this: \n", responseobj);
        return ({
            projName: projName,
            majorHash: responseobj.ipfsHash,
            statusLine: responseobj.statusLine,
            mergeArr: responseobj.mergeObj,
            buffer: buffer,
            url: url
        });
    } catch (err) {
        console.log(err);
        throw new Error(`(readFile) main err ${err.name} :- ${err.message}`);
    }
}


function readForBuffer(filepath) {
    return new Promise((resolve, reject) => {
        try {
            console.log(filepath);
            fs.readFile(filepath,'utf8',(err, data) => {
                if (err) {
                    console.log(err);
                    reject(new Error(`(readFile) fs readfile err ${err.name} :- ${err.message}`));
                }
                resolve(data);
            })
        } catch (err) {
            console.log(err);
            reject(new Error(`(readFile) readForBuffer err ${err.name} :- ${err.message}`));
        }
    })
}
module.exports = router;