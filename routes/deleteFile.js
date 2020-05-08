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
const { exec } = require('child_process');

// isomorphic-git related imports and setup
const git = require('isomorphic-git');

const express = require('express');
const router = express.Router();

router.post('/deleteFile', async (req, res) => {
    var projName = req.body.projName;
    var username = req.body.username;
    var branchToUpdate = req.body.branchToUpdate;
    var curr_majorHash = req.body.majorHash; // latest
    var url = `'http://localhost:7005/projects/bare/${projName}.git'`;

    var authorname = req.body.authorname;
    var authoremail = req.body.authoremail;
    var usermsg = req.body.usermsg;
    var filename = req.body.filename;

    var timestamp = Date.now();

    var barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName + '.git');
    var workdirpath = path.resolve(__dirname, '..', 'projects', projName, branchToUpdate, username + timestamp);

    var filepath = path.resolve(workdirpath, filename)
    try {
        await preRouteChecks(curr_majorHash, projName, username, timestamp, branchToUpdate)
        let response = await main(projName, timestamp, barerepopath,
            workdirpath, curr_majorHash, url, filepath,
            filename, usermsg, authorname, authoremail)
        res.status(200).send(response);
    } catch (err) {
        console.log(err);
        res.status(400).send(`(deleteFile) err ${err.name} :- ${err.message}`);
    }
})

async function main(projName, timestamp, barerepopath,
    workdirpath, curr_majorHash, url, filepath,
    filename, usermsg, authorname, authoremail) {
    try {
        await deleteFile(filepath)
        await autoCommit(workdirpath, filename, usermsg, authorname, authoremail)
        const responseobj = await pushChecker(barerepopath, workdirpath, timestamp, curr_majorHash)
        // .catch( async (err) => { // If ever you want to perform a cleanUp for removeFromIPFS error, refine this catch block so that it can actually catch that error and remove the current workDir.
        //     console.log(err);
        //     await rmWorkdir(workdirpath); // Remove the workdir folder from old branchNamePath
        //     reject(new Error(`(pushChecker) err ${err.name} :- ${err.message}`)); 
        // });
        console.log("pushchecker returned this: \n", responseobj);
        return ({
            projName: projName,
            majorHash: responseobj.ipfsHash,
            statusLine: responseobj.statusLine,
            mergeObj: responseobj.mergeObj,
            url: url
        });
    } catch (err) {
        console.log(err);
        throw new Error(`(deleteFile) main err ${err.name} :- ${err.message}`);
    }
}

function deleteFile(filepath) {
    console.log(filepath);
    return new Promise((resolve, reject) => {
        try {
            fs.unlink(filepath, (err) => {
                if (err) {
                    console.log(err);
                    reject(new Error(`(deleteFile) fs.unlink err ${err.name} :- ${err.message} `));
                }
                resolve(true);
            })
        } catch (err) {
            console.log(err);
            reject(new Error(`(deleteFile) delete-file err ${err.name} :- ${err.message} `));
        }
    })
}

function autoCommit(workdirpath, filename, usermsg, authorname, authoremail) {
    return new Promise((resolve, reject) => {
        try {
            exec(`git add ${filename}`, {
                cwd: workdirpath,
                shell: true
            }, async (err, stdout, stderr) => {
                if (err) { console.log(err); reject(new Error(`(deleteFile) git-add cli err ${err.name} :- ${err.message}`)); }
                if (stderr) { console.log(err); reject(new Error(` (deleteFile) git-add cli stderr: ${stderr}`)); }
                let sha = await git.commit({
                    fs: fs,
                    dir: workdirpath,
                    message: usermsg,
                    author: {
                        name: authorname,
                        email: authoremail
                    }
                })
                console.log("commit hash: \n", sha);
                resolve(true);
            })
        } catch (err) {
            console.log(err);
            reject(new Error(`(deleteFile) git-commit err ${err.name} :- ${err.message}`));
        }
    })
}

module.exports = router;