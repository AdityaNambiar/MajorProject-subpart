/**
 * Return a list of branches from the current working git repo
 * (No changes in .git/ folder - confirmed)
 */

// Misc:
const preRouteChecks = require('../utilities/preRouteChecks');
const pushChecker = require('../utilities/pushChecker');

// isomorphic-git related imports and setup
const fs = require('fs');
const git = require('isomorphic-git');

const path = require('path');
const express = require('express');
const router = express.Router();

router.post('/getBranches', async (req, res) => {
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
        let response = await main(projName, username, timestamp, branchToUpdate, barerepopath, workdirpath, curr_majorHash, url)
        res.status(200).send(response);
    } catch (err) {
        console.log(err);
        res.status(400).send(`(getBranches) err ${err.name} :- ${err.message}`);
    }
});

async function main(projName, username, timestamp, branchToUpdate, barerepopath, workdirpath, curr_majorHash, url) {
    try {
        let branchlist = await gitListBranches(workdirpath)
        return ({
            projName: projName,
            branchlist: branchlist,
            url: url
        });
    } catch (err) {
        console.log(err);
        throw new Error(`(getBranches) main err ${err.name} :- ${err.message}`);
    }
}


async function gitListBranches(workdirpath) {
    // I have to bring in remote branch names as well as local branch names (removing "HEAD" from this because isomorphic returns this for local)
    try {
        var branchlist = [];
        let remoteBranches = await git.listBranches({
            fs: fs,
            dir: workdirpath,
            remote: 'origin'
        })
        let localBranches = await git.listBranches({
            fs:fs,
            dir: workdirpath
        })
        branchlist = localBranches.concat(remoteBranches);
        branchlist = branchlist.filter(branchname => branchname != "HEAD")
        branchlist = branchlist.filter((v, i, a) => a.indexOf(v) === i); // Removing duplicates - credits - https://stackoverflow.com/a/14438954
        return(branchlist);
    } catch (err) {
        console.log(err);
        throw new Error(`(gitListBranches) git-list-branch err ${err.name} :- ${err.message}`);
    }
}
module.exports = router;
