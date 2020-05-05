/**
 * Add files to git repository.
 * combine with commitFile (Direct commit) 
*/

// Misc:    
const addToIPFS = require('../utilities/addToIPFS');
const getFromIPFS = require('../utilities/getFromIPFS');
const removeFromIPFS = require('../utilities/removeFromIPFS');
const cloneBare = require('../utilities/cloneBare');


// isomorphic-git related imports and setup
const fs = require('fs');
const git = require('isomorphic-git'); 

const path = require('path');
const express = require('express');
const router = express.Router();

router.post('/addFile', async (req,res) => {
    var projName = req.body.projName || "app";
    var majorHash = '';
    let buffer = req.body.filebuff || "NEW STRING";
    let filename = req.body.filename || "NEW_FILE"; 
    majorHash = 'QmX4nZGMdwhDCz4NvLrcaVUWJAFL4YzoRS98unY9xx8cLs'; // hard coded
    // IPFS work:
    try{
        if (!fs.existsSync(path.resolve(__dirname,'..','projects',projName+'.git'))) {
            await getFromIPFS(majorHash, projName) // Fetch the bare repo
            await cloneBare(projName); // Clone the bare repo 
            main(projName, majorHash, res, buffer, filename)
        } else {
            main(projName, majorHash, res, buffer, filename)
        }
    }catch(err){
        console.log("addFile outer ERR \n",err);
        res.status(400).send(e);
    }
})

async function main(projName, majorHash, res, buffer, filename) {
    // Git work:
    await writeFile(projName,filename,buffer) // create and update the changes on the file.
    .then( async ()=>{
        try {
            await git.add({
                dir:  path.join(__dirname, '..', 'projects', projName),
                filepath: filename
            })
        }catch(e){
            console.log("addFile git ERR: ",e);
            res.status(400).send(e);
        }
    })
    .then( async ()=>{
        var oldmajorHash = majorHash;
        // Store new state of git repo:
        majorHash = await addToIPFS(projName+'.git');
        // Prevent cluttering IPFS repo by unpinning (and garbage-collect) old states of repo:
        await removeFromIPFS(oldmajorHash, projName);
        console.log("Updated MajorHash (git add): ",majorHash);
        res.status(200).send({projName: projName, majorHash: majorHash});
    })
    .catch((e) => {
        console.log('main catch err: ',e);
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