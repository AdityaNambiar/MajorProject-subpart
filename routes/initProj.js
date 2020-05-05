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

const path = require('path');
const express = require('express');
const router = express.Router();

router.post('/initProj', async (req,res) => {
    var projName = req.body.projName.replace(/\s/g,'-'); 
    var username = req.body.username.replace(/\s/g,'-');
    var majorHash = '';
    var branchToUpdate = 'master';
    var timestamp = Date.now();

    // Git work:
    var authoremail = req.body.authoremail;
    var authorname = req.body.authorname;
    var buffer = req.body.filebuff;
    var filename = req.body.filename || "README.md";
    var usermsg = req.body.usermsg || "Initial Commit";

    var projectspath = path.resolve(__dirname, '..', 'projects');
    var barepath = path.resolve(__dirname, '..', 'projects', 'bare');
    var barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git'); 
    var branchNamepath = path.resolve(__dirname, '..', 'projects', projName, branchToUpdate);
    var workdirpath = path.resolve(__dirname, '..', 'projects', projName, branchToUpdate, username+timestamp);

    try {
        await barePathCheck(barepath)
        await branchNamePathCheck(branchNamepath)
        let response = await main(projName, projectspath, barerepopath, majorHash, workdirpath, filename, buffer,
            usermsg, authorname, authoremail, branchToUpdate, username, timestamp)
        res.status(200).send(response);
    } catch (err) {
        console.log(err);
        res.status(400).send(`main err ${err.name} :- ${err.message}`);
    }
})

function main(projName, projectspath, barerepopath, majorHash, workdirpath, filename, buffer,
        usermsg, authorname, authoremail, branchToUpdate, username, timestamp) 
{ 
    return new Promise ( async (resolve, reject) => {
        try {
            await gitInit(workdirpath)
            await writeFile(workdirpath, filename, buffer);
            await autoCommit(workdirpath,filename, usermsg, authorname, authoremail);
            await gitInitBare(projectspath, branchToUpdate, projName, username+timestamp)
            await rmWorkdir(workdirpath)   
            majorHash = await addToIPFS(barerepopath);
            console.log("MajorHash (git init): ", majorHash);
            resolve({projName: projName, majorHash: majorHash});
        } catch (err) {
            console.log(err);
            reject(`main err ${err.name}: ${err.message}`);
        }
    })
}
function barePathCheck(barepath){
    return new Promise( (resolve, reject) => {
        if (!fs.existsSync(barepath)){
            fs.mkdir(barepath, (err) => {
                if (err) {
                    reject(`projPathCheck err: ${err}`);
                }
                resolve(true);
            })
        }
        resolve(true); // means projects/bare exist.
    })
}

function branchNamePathCheck(branchNamepath) {
    return new Promise( async (resolve, reject) => {
        if (!fs.existsSync(branchNamepath)){
            fs.mkdir(branchNamepath, (err) => {
                if (err) { 
                    reject(`branchNamePathCheck err: ${err}`);
                }
                resolve(true);
            })
        }
        resolve(true); // means projects/projName/branchName exists
    })
}


function gitInit(workdirpath) {
    return new Promise( async (resolve, reject) => {
        try {
            await git.init({
                fs: fs,
                dir: workdirpath
            });
            resolve(true)
        } catch(e) {
            reject(`git-init err: ${e}`);
        }
    })
}
function gitInitBare(projectspath, branchToUpdate, projName, username) {
    return new Promise( async (resolve, reject) => {
        try {
            await exec(`git clone --bare ${projName}/${branchToUpdate}/${username} bare/${projName+'.git'}`, {
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

function autoCommit(workdirpath, filename, usermsg, authorname, authoremail){
    return new Promise( async (resolve, reject) => {
        try {
            await git.add({
                fs: fs,
                dir:  workdirpath,
                filepath: filename
            })
            let sha = await git.commit({
                    fs: fs,
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

function writeFile(workdirpath, filename, buffer) {
    return new Promise( async (resolve, reject) => {
        fs.writeFile(path.resolve(workdirpath, filename), Buffer.from(buffer), (err) => {
            if (err) reject(` fs write err: ${err} `);
            resolve(true);
        })
    })
}

module.exports = router;