/**
 * Make project with their project name.
 * Initialize a git repository with master
 * 
 * 
 */

// Misc:
const addToIPFS = require('../utilities/addToIPFS');
const preRouteChecks = require('../utilities/preRouteChecks');
const pushToBare = require('../utilities/pushToBare');

// Terminal execution:
const { exec } = require('child_process');

// isomorphic-git related imports and setup
const fs = require('fs');
const git = require('isomorphic-git');
git.plugins.set('fs',fs); // Bring your own file system 

const path = require('path');
const express = require('express');
const router = express.Router();

let projName = 'app'
let projDesc = 'HCLApp is a new web app for BE students.'
let README = `PROJECT NAME: ${projName} \n PROJECT DESCRIPTION: ${projDesc} \n`

var workdirpath, barerepopath, majorHash, authoremail, 
    authorname, buffer, filename, 
    usermsg, branchToUpdate;

router.post('/initProj', async (req,res) => {
    projName = req.body.projName;  
    majorHash = 'QmX4nZGMdwhDCz4NvLrcaVUWJAFL4YzoRS98unY9xx8cLs'; // MOST RECENT IPFS HASH - DO NOT REMOVE

    // Git work:
    authoremail = 'adi@g.c';
    authorname = 'Aditya';
    buffer = req.body.filebuff || README.md;
    filename = req.body.filename || "README.md";
    usermsg = req.body.usermsg || "Initial Commit";
    branchToUpdate = 'master';

    barerepopath = path.resolve(__dirname, '..', 'projects', projName+'.git'); 
    workdirpath = path.resolve(__dirname, '..', 'projects', projName, username);

    try {
        await main(projName, workdirpath, barerepopath, majorHash, buffer, filename, usermsg, authorname, authoremail, branchToUpdate)
        .then( () => {
            res.status(200).send({projName: projName, majorHash: majorHash})
        })
    } catch (err) {
        res.status(400).send("git init main err: "+err);
    }
})

async function main(projName, workdirpath, barerepopath, majorHash, buffer, filename, usermsg, authorname, authoremail, branchToUpdate) { 
    return new Promise ( async (resolve, reject) => {
        await gitInit(workdirpath)
        .then( async () => {
            await writeFile(projName,filename, buffer);
        })
        .then( async () => {
            await autoCommit(workdirpath,filename, usermsg, authorname, authoremail);
        })
        .then( async () => {
            await pushToBare(projName, branchToUpdate);
        })
        .then( async () => {
            majorHash = await addToIPFS(barerepopath);
            console.log("MajorHash (git init): ", majorHash);
            resolve({projName: projName, majorHash: majorHash});
        })
        .catch((e) => {
            reject(`main err: ${e}`);
        })
    })
}

async function gitInit(workdirpath) {
    return new Promise( async (resolve, reject) => {
        try {
            await git.init({
                fs,
                dir: workdirpath
            });
            resolve(true)
        } catch(e) {
            reject(`git-init err: ${e}`);
        }
    })
}

async function autoCommit(workdirpath, filename, usermsg, authorname, authoremail){
    return new Promise( async (resolve, reject) => {
        try {
            await git.add({
                dir:  workdirpath,
                filepath: filename
            })
            let sha = await git.commit({
                    fs,
                    dir:  workdirpath,
                    message: usermsg,
                    author: {
                        name: authorname,
                        email: authoremail
                    }
                })
            console.log("commit hash: \n",sha);
            resolve(true);
        } catch(e) {
            reject(`git-init-commit err: ${e}`);
        }
    })
}

async function writeFile(projName, filename, buffer) {
    return new Promise( async (resolve, reject) => {
        fs.writeFile(path.resolve('projects', projName, filename), Buffer.from(buffer), (err) => {
            if (err) reject(` fs write err: ${err} `);
            resolve(true);
        })
    })
}
module.exports = router;