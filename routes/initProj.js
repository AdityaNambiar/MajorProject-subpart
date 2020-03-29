/**
 * Make project manager / leader's directory with their project name.
 * Initialize a git repository 
 */

// Misc:
const addToIPFS = require('../utilities/addToIPFS');

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
    const projLeader = "Aditya" // Hard coded - has to card name or from blockchain?
    var projName = req.body.projName; // 
    var majorHash = '';
    // Git work:
    let buffer = req.body.filebuff || README;
    let filename = req.body.filename || "README";
    let ac_status = true;
    let usermsg = "Initial Commit";
    try {
        if (!fs.existsSync(path.resolve(__dirname,'..',projLeader)))
            main(projLeader,projName,majorHash,res, buffer, filename, ac_status, usermsg)
    } catch (err) {
        console.log("git init main err: ", err)
    }
})

async function main(projLeader, projName, majorHash, res, buffer, filename, ac_status, usermsg) {
    // Create project folder with provided leader's name
    fs.mkdir(path.resolve(__dirname, '..',projLeader), async (err)=>{
        if (err) console.log("mkdir (leader's folder) err: ",err);

        // Create actual project folder with leader's 
        fs.mkdir(path.resolve(__dirname,'..',projLeader,projName), async (err) => {
            if (err) console.log("mkdir (proj folder) err: ", err);

            // Initialize this folder as git repo 
            await git.init({
                fs,
                dir: path.resolve(__dirname,'..',projLeader,projName)
            });
            fs.writeFileSync(path.join(__dirname, projLeader, projName,filename),Buffer.from(buffer));
            try {
                await git.add({
                    dir:  path.join(__dirname, projLeader, projName),
                    filepath: filename
                })
                console.log(`File added is -> ${filename}`);

                if (ac_status) { // if auto-commit is true i.e. user wants to commit when they add this file...
                    let sha = await git.commit({
                        fs,
                        dir:  path.join(__dirname, projLeader, projName),
                        message: usermsg,
                        author: {
                            name: "Aditya",
                            email: "adi@g.c"
                        }
                    })
                    console.log("commit hash: \n",sha);
                }
            res.status(200).send({message:"git init done"});
            }catch(e){
                console.log("git init err: ",e);
                res.status(400).send(e)
            }
        majorHash = await addToIPFS(projLeader,projName);
        console.log("MajorHash (git init): ", majorHash);
    })
}
module.exports = router;