/**
 * Get the file names from request.
 * Pass the file / file buffer of both files.
 */

 
// Misc:
const preRouteChecks = require('../utilities/preRouteChecks');
const rmWorkdir = require('../utilities/rmWorkdir');
const cleanUp = require('../utilities/cleanUp');

const { exec } = require('child_process');
// isomorphic-git related imports and setup
const fs = require('fs');
const git = require('isomorphic-git'); 

const path = require('path');
const express = require('express');
const router = express.Router();

router.post('/diffForCommit', async (req,res) => {
    var projName = req.body.projName;
    var username = req.body.username;
    var curr_majorHash = req.body.majorHash;  // latest
    var branchToUpdate = req.body.branchToUpdate;
    var ref1 = req.body.ref1;
    var url = `'http://localhost:7005/projects/bare/${projName}.git'`;

    var timestamp = "(|)-|-(|)" + Date.now();

    var barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName + '.git');
    var workdirpath = path.resolve(__dirname, '..', 'projects', projName, branchToUpdate, username + timestamp);

    try {
        await preRouteChecks(curr_majorHash, projName, username, timestamp, branchToUpdate)
        let response = await main(projName, username, timestamp, branchToUpdate, ref1, barerepopath, workdirpath, curr_majorHash, url)
        res.status(200).send(response);
    } catch (err) {
        console.log(err);
        res.status(400).send(`(diffForCommit) err ${err.name} :- ${err.message}`);
    }
})

async function main(projName, username, timestamp, branchToUpdate, ref1, barerepopath, workdirpath, curr_majorHash, url) {
    try {
        let diffOutput = await gitDiffRefs(ref1, workdirpath)
        await rmWorkdir(workdirpath);
        return ({
            projName: projName,
            diffOutput: Buffer.from(diffOutput),
            url: url
        });
    } catch (err) {
        console.log(err);
        await cleanUp(workdirpath, branchName);
        throw new Error(`(diffFiles) main err ${err.name} :- ${err.message}`);
    }
}

function gitDiffRefs(ref1, workdirpath) {
    return new Promise((resolve, reject) => {
        try {
            exec(`git show -p --pretty="raw" ${ref1}`, {
                cwd: workdirpath,
                shell: true
            }, (err, stdout, stderr) => {
                if (err) {
                    console.log(err);
                    reject(new Error(`(gitDiffRefs) git-log err ${err.name} :- ${err.message}`));
                }
                if (stderr) {
                    console.log(stderr);
                    reject(new Error(`(gitDiffRefs) git-log stderr: ${stderr}`));
                }
                let a = stdout.split("diff --git");
                for (let i = 1; i < a.length; i++) {
                    a[i] = "diff --git" + a[i];
                }
                a.shift();
                resolve(a.join('\n'));                
            })
        } catch(err) {
            console.log(err);
            reject(new Error(`(gitDiffRefs) git-log err ${err.name} :- ${err.message}`));
        } 
    })
}

module.exports = router;