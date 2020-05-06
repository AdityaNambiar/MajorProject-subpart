/**
 * Show the commit history of file using:
 * `git log -s --pretty=raw ${filename}`
 */


// Misc:
const addToIPFS = require('../utilities/addToIPFS');
const preRouteChecks = require('../utilities/preRouteChecks');
const removeFromIPFS = require('../utilities/removeFromIPFS');
const statusChecker = require('../utilities/statusChecker');
const pushChecker = require('../utilities/pushChecker');
const pushToBare = require('../utilities/pushToBare');
const rmWorkdir = require('../utilities/rmWorkdir');

// Terminal execution import:
const { exec } = require('child_process');
// isomorphic-git related imports and setup
const fs = require('fs');
const git = require('isomorphic-git');

const path = require('path');
const express = require('express');
const router = express.Router();

router.post('/fileCommitHistory', async (req, res) => {
    var projName = req.body.projName;
    var username = req.body.username;
    var branchToUpdate = req.body.branchToUpdate;
    var curr_majorHash = req.body.majorHash; // latest
    var filename = req.body.filename;
    var url = `'http://localhost:7005/projects/bare/${projName}.git'`;

    var timestamp = Date.now();

    // Git work:
    var barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName + '.git');
    var workdirpath = path.resolve(__dirname, '..', 'projects', projName, branchToUpdate, username + timestamp);

    try {
        await preRouteChecks(curr_majorHash, projName, username, timestamp, branchToUpdate)
        let response = await main(projName, timestamp, barerepopath, filename,
                                  workdirpath, curr_majorHash, url)
        res.status(200).send(response);
    } catch (err) {
        console.log(err);
        res.status(400).send(`(fCH) err ${err.name} :- ${err.message}`);
    }
});

async function main(projName, timestamp, barerepopath, filename,
                    workdirpath, curr_majorHash, url) {
    try {
        let cObj = await fileCommitHistory(workdirpath, filename)
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
            mergeArr: responseobj.mergeObj,
            commitObj: cObj,
            url: url
        });
    } catch (err) {
        console.log(err);
        throw new Error(`(fCH) main err ${err.name} :- ${err.message}`);
    }
}

function fileCommitHistory(workdirpath, filename) {
    return new Promise((resolve, reject) => {
        try {
            exec(`git log --pretty=raw ${filename}`, {
                cwd: workdirpath,
                shell: true
            }, (err, stdout, stderr) => {
                if (err) { console.log(err); reject(new Error(`git-log err ${err.name} :- ${err.message}`)); }
                if (stderr) { console.log(stderr); reject(new Error(`git-log stderr: ${stderr}`));}
                //console.log(stdout);
                
                stdout = "\n" + stdout;
                let a = stdout.split(/\ncommit /);
                for (let i = 1; i < a.length; i++) {
                    a[i] = "commit " + a[i];
                }
                a.shift();

                var b;
                for (var i = 0; i < a.length; i++) {
                    b = a[i].trim().split('\n');
                    var commitobj = {
                        commitHash: '',
                        parentHashArr: [],
                        author_name: '',
                        author_timestamp: '',
                        committer_name: '',
                        committer_timestamp: '',
                        commit_msg: ''
                    }
                    b.forEach((e, i) => {
                        switch (e.split(' ')[0]) {
                            case "commit": commitobj.commitHash = e.split(' ')[1]; break;
                            case "parent": commitobj.parentHashArr.push(e.split(' ')[1]); break;
                            case "author":
                                commitobj.author_name = e.split(' ')[1];
                                commitobj.author_timestamp = new Date(e.split(' ')[3] * 1000).toLocaleString('en-US', { hour12: false });;
                                break;

                            case "committer":
                                commitobj.committer_name = e.split(' ')[1];
                                commitobj.committer_timestamp = new Date(e.split(' ')[3] * 1000).toLocaleString('en-US', { hour12: false });;
                                break;
                        }
                        if (i == b.length - 1) {
                            commitobj.commit_msg = e.trim();
                        }
                    })
                    a[i] = commitobj;
                }
                resolve(a);
            })
        } catch (err) {
            console.log(err);
            reject(new Error(`(fCH) git-log err ${err.name} :- ${err.message}`));
        }
    })
}
module.exports = router;