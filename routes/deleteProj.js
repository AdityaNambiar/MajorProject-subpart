/**
 * A route that just calls removeFromIPFS().
 */

 // Misc:
 const removeFromIPFS = require('../utilities/removeFromIPFS');


// isomorphic-git related imports and setup
const fs = require('fs-extra');

const path = require('path');
const express = require('express');
const router = express.Router();

router.post('/deleteProj', async (req,res) => {
    var projName = req.body.projName;
    var curr_majorHash = req.body.majorHash;  // latest

    var projectspath = path.resolve(__dirname, '..', 'projects');
    var barepath = path.resolve(__dirname, '..', 'projects', 'bare');
     // paths to be deleted:
    var barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git'); 
    var projNamepath = path.resolve(__dirname, '..', 'projects', projName);

    try{
        await projPathCheck(projectspath)
        await barePathCheck(barepath);
        let response = await main(projName, projNamepath, barerepopath, curr_majorHash)
        res.status(200).send(response);
    }catch(err){
        console.log(err);
        res.status(400).send(`(deleteProj) err ${err.name} :- ${err.message}`);
    }
})

async function main(projName, projNamepath, barerepopath, curr_majorHash){
    try {
        await deleteProj(projNamepath, barerepopath)
        await removeFromIPFS(curr_majorHash);
        console.log("MajorHash (deleteProj) (same that was passed to this route): ", curr_majorHash);
        return({
            projName: projName
        });
    } catch (err) {
        console.log(err);
        throw new Error(`(deleteProj) main err ${err.name} :- ${err.message}`);
    }
}
async function projPathCheck(projectspath){
    return new Promise( (resolve, reject) => {
        if (!fs.existsSync(projectspath)){
            fs.mkdir(projectspath, (err) => {
                if (err) {
                    reject(`projPathCheck err: ${err}`);
                }
                resolve(true);
            })
        }
        resolve(true); // means projects/ exist.
    })
}

async function barePathCheck(barepath){
    return new Promise( (resolve, reject) => {
        if (!fs.existsSync(barepath)){
            fs.mkdir(barepath, (err) => {
                if (err) {
                    reject(`barePathCheck err: ${err}`);
                }
                resolve(true);
            })
        }
        resolve(true); // means projects/bare exist.
    })
}

function deleteProj(projNamepath, barerepopath){
    return new Promise( (resolve, reject) => {
        try {
            // Delete projects/projName folder:
            fs.remove(projNamepath, (err) => {
                if (err) {
                    console.log(err);
                    reject(new Error(`(deleteProj) remove-projNamepath err ${err.name} :-  ${err.message} `));
                }
                // Delete bare/projName.git repo:
                fs.remove(barerepopath, (err) => {
                    if (err) { 
                        console.log(err);
                        reject(new Error(`(deleteProj) remove-barerepopath ${err.name} :- ${err.message}`));
                    }
                    resolve(true);
                })
            })
        } catch(err) {
            console.log(err);
            reject(new Error(`(deleteProj) remove err ${err.name} :- ${err.message}`));
        }  
    }) 
}
module.exports = router