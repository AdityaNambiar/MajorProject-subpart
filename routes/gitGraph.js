/**
 * Show the 'branch diagram' or 'git log graph' on frontend.
 */

// Misc:
const preRouteChecks = require('../utilities/preRouteChecks');
const rmWorkdir = require('../utilities/rmWorkdir');

// Terminal execution import
const { exec } = require('child_process');

// isomorphic-git related imports and setup
const fs = require('fs');
const git = require('isomorphic-git');

const path = require('path');
const express = require('express');
const router = express.Router();

router.post('/gitGraph', async (req, res) => {
    var projName = req.body.projName;
    var username = req.body.username;
    var curr_majorHash = req.body.majorHash;  // latest
    var branchToUpdate = req.body.branchToUpdate;

    var url = `'http://localhost:7005/projects/bare/${projName}.git'`;

    var timestamp = "(|)-|-(|)" + Date.now();

    var barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName + '.git');
    var workdirpath = path.resolve(__dirname, '..', 'projects', projName, branchToUpdate, username + timestamp);

    try {
        await preRouteChecks(curr_majorHash, projName, username, timestamp, branchToUpdate)
        let response = await main(projName, username, timestamp, branchToUpdate, barerepopath,
                                  workdirpath, curr_majorHash, url)
        res.status(200).send(response);
    } catch (err) {
        console.log(err);
        res.status(400).send(`(getBranches) err ${err.name} :- ${err.message}`);
    }
});

async function main(projName, username, timestamp, branchToUpdate, barerepopath,
                    workdirpath, curr_majorHash, url) {
    try {
        let graphOutput = await gitGraphFetch(workdirpath)
        await rmWorkdir(workdirpath);
        return ({
            projName: projName,
            graphOutput: graphOutput,
            url: url
        });
    } catch (err) {
        console.log(err);
        throw new Error(`(gitGraph) main err ${err.name} :- ${err.message}`);
    }
}

function gitGraphFetch(workdirpath) {
    return new Promise((resolve, reject) => {
        try {
            exec('git log --all --graph --decorate --oneline >> graphop', {
                cwd: workdirpath,
                shell: true,
            }, (err, stdout, stderr) => {
                if (err) {
                    console.log(err);
                    reject(new Error(`(gitGraphFetch) git-graph cli err ${err.name} :- ${err.message}`));
                }
                if (stderr) {
                    console.log(stderr);
                    reject(new Error(`(gitGraphFetch) git-graph cli stderr: ${stderr}`));
                }
                fs.readFile(path.resolve(workdirpath, 'graphop'), (err, data) => {
                    if (err) {
                        console.log(err);
                        reject(new Error(`(gitGraphFetch) read-file err ${err.name} :- ${err.message}`))
                    }
                    resolve(data);
                })
            });
        } catch (err) {
            console.log(err);
            reject(new Error(`(gitGraphFetch) git-log-graph err ${err.name} :- ${err.message}`))
        }
    })
}
module.exports = router;