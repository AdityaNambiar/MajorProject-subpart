/**
 * Fetch the filebuffobj from provided username+timestamp - i.e. workdirpath (unmerged workdir) 
 */

//MISC:
const preRouteChecks = require('../utilities/preRouteChecks');
const pushChecker = require('../utilities/pushChecker');
const rmWorkdir = require('../utilities/rmWorkdir');

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const express = require('express');
const router = express.Router();

router.post('/readMergeFiles', async (req, res) => {
    try {
        var projName = req.body.projName;
        var mergeobj = JSON.parse(req.body.mergeobj);
        var branchToUpdate = req.body.branchToUpdate;

        var url = `'http://localhost:7005/projects/bare/${projName}.git'`;
        var mergeid = mergeobj.mergeid;
        var workdirpath = path.join(__dirname, '..', 'projects', projName, branchToUpdate, mergeid);
        let response = await main(projName, workdirpath, url)
        res.status(200).send(response);
    } catch (err) {
        console.log(err);
        res.status(400).send(`(readMergeFiles) err ${err.name} :- ${err.message}`);
    }
})

async function main(projName, workdirpath, url) {
    try {
        let buffer = await checkUnmergedFiles(workdirpath)
        return ({
            projName: projName,
            buffer: buffer,
            url: url
        });
    } catch (err) {
        console.log(err);
        throw new Error(`(readMergeFiles) main err ${err.name} :- ${err.message}`);
    }
}

function checkUnmergedFiles(workdirpath) {
    
    return new Promise((resolve, reject) => {
        try {
            exec(`git diff --name-only --diff-filter=U`, {
                cwd: workdirpath,
                shell: true
            }, async (err, stdout, stderr) => {
                if (err) { console.log(err); reject(new Error(`(checkUnmergedFiles) unmerged file show cli err ${err.name} :- ${err.message}`)) }
                if (stderr) { console.log(err); reject(new Error(`(checkUnmergedFiles) unmerged file show cli stderr: ${stderr}`)) }
                var filename_arr = [];
                filename_arr = stdout.trim().split('\n');
                console.log('filename arr: \n', filename_arr);
                var filebuffarr = [];
                for (var i = 0; i < filename_arr.length; i++) {
                    let filebuffobj = {}
                    filebuffobj[filename_arr[i]] = await readForBuffer(workdirpath, filename_arr[i])
                        .catch((err) => {
                            console.log(err);
                            reject(new Error(`(checkUnmergedFiles) read-for-buff await err ${err.name} :- ${err.message}`));
                        })
                    filebuffarr.push(filebuffobj);
                }
                resolve(filebuffarr);
            })
        } catch (err) {
            console.log(err);
            reject(new Error(`(checkUnmergedFiles) git-diff err ${err.name} :- ${err.message}`))
        }
    })
}

function readForBuffer(workdirpath, filename) {
    return new Promise((resolve, reject) => {
        // Specify this as 2nd parameter: 'utf-8' - to prevent getting a buffer.
        try {
            fs.readFile(path.resolve(workdirpath, filename), (err, data) => {
                if (err) {
                    console.log(err);
                    reject(new Error(`(checkUnmergedFiles) fs readfile err ${err.name} :- ${err.message}`));
                }
                resolve(data);
            })
        } catch (err) {
            console.log(err);
            reject(new Error(`(checkUnmergedFiles) readForBuffer err ${err.name} :- ${err.message}`));
        }
    })
}

module.exports = router