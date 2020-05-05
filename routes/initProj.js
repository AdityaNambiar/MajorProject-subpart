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

var projName, workdirpath, barerepopath, projectspath,
    majorHash, authoremail, authorname, buffer, 
    username, filename, usermsg, branchToUpdate, 
    barepath, branchNamepath;

router.post('/initProj', async (req,res) => {
    projName = req.body.projName.replace(/\s/g,'-'); 
    username = req.body.username.replace(/\s/g,'-');
    majorHash = '';
    branchToUpdate = 'master';
    timestamp = Date.now();

    // Git work:
    authoremail = req.body.authoremail;
    authorname = req.body.authorname;
    buffer = req.body.filebuff;
    filename = req.body.filename || "README.md";
    usermsg = req.body.usermsg || "Initial Commit";

    projectspath = path.resolve(__dirname, '..', 'projects');
    barepath = path.resolve(__dirname, '..', 'projects', 'bare');
    barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git'); 
    branchNamepath = path.resolve(__dirname, '..', 'projects', projName, branchToUpdate);
    workdirpath = path.resolve(__dirname, '..', 'projects', projName, branchToUpdate, username+timestamp);

    try {
        await barePathCheck(barepath)
        .then( async () => {
            await branchNamePathCheck(branchNamepath)
        })
        .then( async () => {
            let response = await main()
            return response;
        })
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
            await writeFile(workdirpath, filename, buffer);
        })
        .then( async () => {
            await autoCommit(workdirpath,filename, usermsg, authorname, authoremail);
        })
        .then( async () => {
            await gitInitBare(branchToUpdate, projName, username+timestamp)
        })
        .then ( async () => {
            await rmWorkdir(workdirpath)   
        })
        .then( async () => {
            majorHash = await addToIPFS(barerepopath);
        })
        .then( () => {
            console.log("MajorHash (git init): ", majorHash);
            resolve({projName: projName, majorHash: majorHash});
        })
        .catch( (e) => {
            reject(`main err: ${e}`);
        })
    })
}
async function barePathCheck(barepath){
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

async function branchNamePathCheck(branchNamepath) {
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
async function gitInitBare(branchToUpdate, projName, username) {
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

async function writeFile(workdirpath, filename, buffer) {
    return new Promise( async (resolve, reject) => {
        fs.writeFile(path.resolve(workdirpath, filename), Buffer.from(buffer), (err) => {
            if (err) reject(` fs write err: ${err} `);
            resolve(true);
        })
    })
}

module.exports = router;