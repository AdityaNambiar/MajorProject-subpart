// Misc:
import addToIPFS from '../misc/addToIPFS';

// isomorphic-git related imports and setup
const git = require('isomorphic-git');
git.plugins.set('fs',fs); // Bring your own file system 

const path = require('path');
const fs = require('fs');
const express = require('express');
const router = express.Router();

router.post('/', async(req,res) => {
    const projLeader = "Aditya" // Hard coded - has to card name or from blockchain?
    var projName = "";
    var majorHash = '';
    try {
        
        // Create project folder with provided leader's name
        fs.mkdir(path.join(__dirname, projLeader), (err)=>{
            if (err) console.log("mkdir (leader's folder) err: ",err);
            // Create actual project folder with leader's 
            fs.mkdir(path.join(__dirname, projLeader, req.body.projName), async (err) => {
                if (err) console.log("mkdir (proj folder) err: ", err);
                // Initialize this folder as git repo 
                try{
                    await git.init({
                        fs,
                        dir: path.join(__dirname, projLeader, req.body.projName)
                    });
                    res.status(200).send({message:"git init done"});
                }catch(e){
                    console.log("git init err: ",e);
                    res.status(400).send(e)
                }
            })
            addToIPFS(projLeader,req.body.projName);
        })
    } catch (err) {
        console.log("git init outer catch err: ", err)
    }
})

module.exports = router;