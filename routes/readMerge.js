/**
 * Fetch the filebuffobj from provided username+timestamp - i.e. workdirpath (unmerged workdir) 
 */

//MISC:
const preRouteChecks = require('../utilities/preRouteChecks');
const pushChecker = require('../utilities/pushChecker');
const rmWorkdir = require('../utilities/rmWorkdir');

const path = require('path');
const fs = require('fs');

const express = require('express');
const router = express.Router();

router.post('/readMerge', async (req, res) => {
    var projName = req.body.projName;
    var branchToUpdate = req.body.branchToUpdate;
    var curr_majorHash = req.body.majorHash; // latest
    var mergeid = req.body.mergeid;
    var filename = req.body.filename;
    var url = `'http://localhost:7005/projects/bare/${projName}.git'`;
    

    var barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName + '.git');
    var workdirpath = path.resolve(__dirname, '..', 'projects', projName, branchToUpdate, mergeid);
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
        let buffer = await checkUnmergedFiles(filepath)
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

function checkUnmergedFiles(workdirpath){
    var filename_arr = [];
    var filebuffobj = {};
    return new Promise( (resolve, reject) => {
        try {
                exec(`git diff --name-only --diff-filter=U`, {
                    cwd: workdirpath,
                    shell: true
                }, async (err, stdout, stderr) => {
                    if (err) { console.log(err); reject(new Error(`(checkUnmergedFiles) unmerged file show cli err ${err.name} :- ${err.message}`)) }
                    if (stderr) { console.log(err); reject(new Error(`(checkUnmergedFiles) unmerged file show cli stderr: ${stderr}`)) }
                    filename_arr = [];
                    filename_arr = stdout.trim().split('\n');
                    console.log('filename arr: \n', filename_arr);
                    for (var i = 0; i < filename_arr.length; i++) {
                        filebuffobj[filename_arr[i]] = await readForBuffer(workdirpath, filename_arr[i]);
                    }
                    resolve(filebuffobj);
                })
        } catch(err) {
            console.log(err);
            reject(new Error(`(checkUnmergedFiles) git-diff err ${err.name} :- ${err.message}`))
        }
    })
}

async function readForBuffer(workdirpath, filename){
    return new Promise((resolve, reject) =>{
        // Specify this as 2nd parameter: 'utf-8' - to prevent getting a buffer.
        try {
            fs.readFile(path.resolve(workdirpath, filename),(err, data) => {
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