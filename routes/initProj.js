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
    var projName = req.body.projName; 
    var username = req.body.username;
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
        let response = await main(projName, projectspath, barerepopath, workdirpath, filename, buffer,
            usermsg, authorname, authoremail, branchToUpdate, username, timestamp)
        res.status(200).send(response);
    } catch (err) {
        console.log(err);
        res.status(400).send(`(initProj) err ${err.name} :- ${err.message}`);
    }
})

async function main(projName, projectspath, barerepopath, 
        workdirpath, filename, buffer, usermsg, authorname, 
        authoremail, branchToUpdate, username, timestamp) {   
    try {
        await gitInit(workdirpath)
        await writeFile(workdirpath, filename, buffer);
        await autoCommit(workdirpath,filename, usermsg, authorname, authoremail);
        await gitInitBare(projectspath, branchToUpdate, projName, username+timestamp)
        await rmWorkdir(workdirpath)   
        var majorHash = await addToIPFS(barerepopath);
        console.log("MajorHash (git init): ", majorHash);
        return({projName: projName, majorHash: majorHash});
    } catch (err) {
        console.log(err);
        throw new Error(`(initProj) main err ${err.name}: ${err.message}`);
    }
}
function barePathCheck(barepath){
    return new Promise( (resolve,reject) => {
        if (!fs.existsSync(barepath)){
            fs.mkdir(barepath, { recursive: true }, (err) => {
                if (err) {
                    console.log(err);
                    reject(new Error(`barePathCheck err ${err.name} :- ${err.message}`));
                }
                resolve(true);
            })
        }
        resolve(true); // means projects/bare exist.
    })
}

function branchNamePathCheck(branchNamepath) {
    return new Promise ( (resolve, reject) => {
        if (!fs.existsSync(branchNamepath)){
            fs.mkdir(branchNamepath, { recursive: true }, (err) => {
                if (err) { 
                    console.log(err);
                    reject(new Error(`branchNamePathCheck err ${err.name} :- ${err.message}`));
                }
                resolve(true);
            })
        }
        resolve(true); // means projects/projName/branchName exists
    })
}


async function gitInit(workdirpath) {
    try {
        await git.init({
            fs: fs,
            dir: workdirpath
        });
        return Promise.resolve(true)
    } catch(err) {
        throw new Error(`git-init err ${err.name} :- ${err.message}`);
    }
}
function gitInitBare(projectspath, branchToUpdate, projName, username) {
    return new Promise ( (resolve, reject) => {
        try {
            exec(`git clone --bare '${projName}/${branchToUpdate}/${username}' 'bare/${projName+'.git'}'`, {
                cwd: projectspath,
                shell: true
            }, (err, stdout, stderr) => {
                if (err) { console.log(err); reject(new Error(`git-bare-clone cli err ${err.name}: ${err.message}`)); }
                //if (stderr) { throw new Error(`git-bare-clone cli  stderr: ${stderr}`); }
                resolve(true);
            })
        } catch(err) {
            console.log(err);
            reject(new Error(`git-bare-clone err ${err.name} :- ${err.message}`));
        }
    })
}

async function autoCommit(workdirpath, filename, usermsg, authorname, authoremail){
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
        return Promise.resolve(true);
    } catch(err) {
        console.log(err);
        throw new Error(`git-init-autoCommit err ${err.name} :- ${err.message}`);
    }
}

async function writeFile(workdirpath, filename, buffer) {
    fs.writeFile(path.resolve(workdirpath, filename), Buffer.from(buffer), (err) => {
            if (err) { console.log(err); throw new Error(`(initProj) fs write err ${err.name} :- ${err.message} `); }
            return Promise.resolve(true);
    })
}

module.exports = router;