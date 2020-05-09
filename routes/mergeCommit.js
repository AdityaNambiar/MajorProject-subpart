/**
 * Special route 
 * - To commit (one or more) files that had conflicts and have been resolved 
 * and thus users press on "Commit" to submit resolved changes
 */

// Misc:
const preRouteChecks = require('../utilities/preRouteChecks');
const pushChecker = require('../utilities/pushChecker');

const { exec } = require('child_process');
// isomorphic-git related imports and setup
const fs = require('fs');
const git = require('isomorphic-git');

const path = require('path');
const express = require('express');
const router = express.Router();

router.post('/mergeCommit', async (req, res) => {
    try {
        var projName = req.body.projName;
        var curr_majorHash = req.body.majorHash; // latest
        var username = req.body.username;
        var mergeobj = JSON.parse(req.body.mergeobj);
        var branchToUpdate = '';
        var filebuffobj = JSON.parse(req.body.filebuffobj);
        var url = `'http://localhost:7005/projects/bare/${projName}.git'`;
        var mergeid = mergeobj.mergeid;
        var title = mergeobj.title;
        // Using Regex to avoid vigorously checking to make sure if its type is branch or pull because there's type special as well. 
        var rgxForBranch = /Merge conflict raised when merging/
        var rgxForPull = /Merge conflict raised pulling/
        if (rgxForBranch.test(title))
            branchToUpdate = title.split("merging ")[1].split(" into ")[1]; // Destination branch name (where it should be left out)
        if (rgxForPull.test(title))
            branchToUpdate = title.split("pulling ")[1].split(" branch")[0];

        var authorname = req.body.authorname;
        var authoremail = req.body.authoremail;
        var usermsg = req.body.usermsg;

        var timestamp = parseInt(mergeid.split("(|)-|-(|)")[1]); // timestamp of type "number".

        // Git work:
        var barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName + '.git');
        var workdirpath = path.resolve(__dirname, '..', 'projects', projName, branchToUpdate, mergeid);

        let response = await main(projName, username, timestamp, branchToUpdate, filebuffobj, barerepopath,
            workdirpath, curr_majorHash, url, usermsg, authorname, authoremail)
        res.status(200).send(response);
    } catch (err) {
        console.log(err);
        res.status(400).send(`(mergeCommit) err ${err.name} :- ${err.message}`);
    }
})

async function main(projName, username, timestamp, branchToUpdate, filebuffobj, barerepopath,
    workdirpath, curr_majorHash, url, usermsg, authorname, authoremail) {
    try {
        for (let filename in filebuffobj) {
            await writeFile(workdirpath, filename, filebuffobj[filename]);
            await addFile(workdirpath, filename);
        }
        await commit(workdirpath, usermsg, authorname, authoremail)
        const responseobj = await pushChecker(projName, username, timestamp, branchToUpdate, barerepopath, workdirpath, curr_majorHash)
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
        throw new Error(`(mergeCommit) main err ${err.name} :- ${err.message}`);
    }
}

async function addFile(workdirpath, filename) {
    try {
        await git.add({
            fs: fs,
            dir: workdirpath,
            filepath: filename
        })
        return (true);
    } catch (err) {
        console.log(err);
        throw new Error(`(addFile) git-addfile err ${err.name} :- ${err.message}`);
    }
}

function commit(workdirpath, usermsg, authorname, authoremail) {
    return new Promise( (resolve, reject) => {
        try {
            exec(`git commit -m "${usermsg}" --author="${authorname} <${authoremail}>"`,{
                cwd: workdirpath,
                shell: true
            }, (err, stdout, stderr) => {
                console.log("merge commit stdout: ",stdout);
                if (err) {
                    console.log(err);
                    reject(new Error(`(commit) git-commit err ${err.name} :- ${err.message}`))
                }
                if (stderr) {
                    console.log(stderr);
                    reject(new Error(`(commit) git-commit stderr: ${stderr}`))
                }
                resolve(true);
            })
        } catch (err) {
            console.log(err);
            throw new Error(`(commit) git-commit err ${err.name} :- ${err.message}`);
        }
    })
}
function writeFile(workdirpath, filename, buffer) {
    return new Promise((resolve, reject) => {
        fs.writeFile(path.resolve(workdirpath, filename), Buffer.from(buffer), (err) => {
            if (err) {
                console.log(err);
                reject(new Error(`(writeFile) fs write err ${err.name} :- ${err.message} `));
            }
            resolve(true);
        })
    })
}

module.exports = router;