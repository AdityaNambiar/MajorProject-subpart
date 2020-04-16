/**
 * Make project with their project name.
 * Initialize a git repository with master
 * 
 * 
 */

// Misc:
const addToIPFS = require('../utilities/addToIPFS');
const rmWorkdir = require('../utilities/rmWorkdir');

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

var workdirpath, barerepopath, projectspath, majorHash, 
    authoremail, authorname, buffer, username,
    filename, usermsg, branchToUpdate;

router.post('/initProj', async (req,res) => {
    projName = req.body.projName.replace(/\s/g,'-'); 
    username = req.body.username.replace(/\s/g,'-');
    majorHash = '';
    branchToUpdate = 'master';
    // Git work:
    authoremail = req.body.authoremail;
    authorname = req.body.authorname;
    buffer = req.body.filebuff || README.md;
    filename = req.body.filename || "README.md";
    usermsg = req.body.usermsg || "Initial Commit";

    projectspath = path.resolve(__dirname, '..', 'projects');
    barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git'); 
    workdirpath = path.resolve(__dirname, '..', 'projects', projName, username);

    try {
        await main()
        .then( (response) => {
            res.status(200).send(response);
        })
    } catch (err) {
        res.status(400).send("git init main err: "+err);
    }
})

async function main() { 
    return new Promise ( async (resolve, reject) => {
        gitInit(workdirpath)
        .then( async () => {
            await writeFile(projName, username, filename, buffer);
        })
        .then( async () => {
            await autoCommit(workdirpath,filename, usermsg, authorname, authoremail);
        })
        .then( async () => {
            await gitInitBare(projName, username)
        })
        .then ( async () => {
            await rmWorkdir(projName, username)
        })
        .then( async () => {
            majorHash = await addToIPFS(barerepopath);
        })
        .then( () => {
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
async function gitInitBare(projName, username) {
    return new Promise( async (resolve, reject) => {
        try {
            await exec(`git clone --bare ${projName}/${username} bare/${projName+'.git'}`, {
                cwd: projectspath,
                shell: true
            }, (err, stdout, stderr) => {
                if (err) reject(`git-bare-clone err: ${err}`);
                if (stderr) //reject(`git-bare-clone stderr: ${stderr}`);
                resolve(true);
            })
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

async function writeFile(projName, username, filename, buffer) {
    return new Promise( async (resolve, reject) => {
        fs.writeFile(path.resolve(__dirname, '..','projects', projName, username, filename), Buffer.from(buffer), (err) => {
            if (err) reject(` fs write err: ${err} `);
            resolve(true);
        })
    })
}
module.exports = router;