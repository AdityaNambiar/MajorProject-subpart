/**
 * Make project manager / leader's directory with their project name.
 * Initialize a git repository 
 */

// Misc:
const addToIPFS = require('../utilities/addToIPFS');

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


router.post('/initProj', async (req,res) => {
    var projName = req.body.projName; // 
    var majorHash = '';
    // Git work:
    let authoremail = 'adi@g.c';
    let authorname = 'Aditya';
    let buffer = req.body.filebuff || README;
    let filename = req.body.filename || "README";
    let usermsg = "Initial Commit";
    try {
        if (!fs.existsSync(path.resolve(__dirname,'..','projects',projName)))
            main(projName, majorHash, res, buffer, filename, usermsg)
    } catch (err) {
        console.log("git init main err: ", err)
    }
})

async function main(projName, majorHash, res, buffer, filename, usermsg) {
    fs.mkdir(path.resolve(__dirname,'..','projects',projName), async (err) => {
            if (err) console.log("mkdir (proj folder) err: ", err);

            // Initialize this folder as git repo 
            await gitInit(projName)
            .then( async () => {
                try {
                    await writeFile(projName,filename, buffer);
                }catch(e) {
                    res.status(400).send({msg: "writeFile err: "+e})
                }
            })
            .then( async () => {
                 try{
                    await autoCommit(projName,filename, usermsg, authorname, authoremail);
                 }catch(e){
                    res.status(400).send({msg: "autocommit err: "+e})
                 }
            })
            .then( async () => {
                try{
                    await clone(projName)
                    console.log("clone done.");
                } catch(e) {
                    res.status(400).send({msg: "clone err: "+e})
                }
            })
            .then( async () => {
                majorHash = await addToIPFS(projName+'.git');
                console.log("MajorHash (git init): ", majorHash);
                res.status(200).send({projName: projName, majorHash: majorHash})
            })
            .catch((e) => {
                console.log('main catch err: ',e);
            })
        })
}

async function gitInit(projName) {
    return new Promise( async (resolve, reject) => {
        try {
            await git.init({
                fs,
                dir: path.resolve(__dirname,'..',projName)
            });
            resolve(true)
        } catch(e) {
            reject(e);
        }
    })
}

async function clone(projName) {
    return new Promise( async (resolve, reject) => {
        try {
            await exec(`git clone --bare ${projName} ${projName+'.git'}`,{
                cwd: '.',
                shell: true
            }, (err, stdout, stderr) => {
                if (err) console.log('init clone cli err: ',err);
                if (stderr) console.log('init clone cli stderr: ',stderr);
                resolve(true)
            })
        } catch(e) {
            reject(e);
        }
    })
}

async function autoCommit(projName, filename, usermsg, authorname, authoremail){
    return new Promise( async (resolve, reject) => {
        try {
            await git.add({
                dir:  path.join(__dirname, '..', 'projects', projName),
                filepath: filename
            })
            let sha = await git.commit({
                    fs,
                    dir:  path.join(__dirname, '..', 'projects', projName),
                    message: usermsg,
                    author: {
                        name: authorname,
                        email: authoremail
                    }
                })
            console.log("commit hash: \n",sha);
            resolve(true);
        } catch(e) {
            reject(e);
        }
    })
}

async function writeFile(projName, filename, buffer) {
    return new Promise( async (resolve, reject) => {
        fs.writeFile(path.resolve('projects',projName, filename),Buffer.from(buffer),(err) => {
            if (err) { console.log('fs write err: ', err); reject(e); }
            resolve(true);
        })
    })
}
module.exports = router;