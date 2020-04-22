/**
 * A route that just calls removeFromIPFS().
 */

 // Misc:
const addToIPFS = require('../utilities/addToIPFS');
const preRouteChecks = require('../utilities/preRouteChecks');
const removeFromIPFS = require('../utilities/removeFromIPFS');
const statusChecker = require('../utilities/statusChecker');
const pushChecker = require('../utilities/pushChecker');
const pushToBare = require('../utilities/pushToBare');
const rmWorkdir = require('../utilities/rmWorkdir');

const getFromIPFS = require('../utilities/getFromIPFS');

// isomorphic-git related imports and setup
const fs = require('fs');

const path = require('path');
const express = require('express');
const router = express.Router();

var projName, curr_majorHash, projectspath,
    barepath, barerepopath, projNamepath;

router.post('/deleteProj', async (req,res) => {
    projName = req.body.projName.replace(/\s/g,'-');
    curr_majorHash = req.body.majorHash;  // latest

    projectspath = path.resolve(__dirname, '..', 'projects');
    barepath = path.resolve(__dirname, '..', 'projects', 'bare');
    barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git'); 
    projNamepath = path.resolve(__dirname, '..', 'projects', projName);

    try{
        await projPathCheck(projectspath)
        .then ( async () => {
            await barePathCheck(barepath);
        })
        .then( async () => {
            //console.log("Out of barerepopathcheck");
            await projNamePathCheck(projNamepath);
        })
        .then( async () => {
            let response = await main()
            return response;
        })
        .then ( (response) => {
            res.status(200).send(response);
        })
    }catch(e){
        res.status(400).send(`main caller err: ${e}`);
    }
})

async function main(){
    return new Promise ( async (resolve, reject) => {
        await deleteProj()
        .then( async () => {
            // Remove old state from IPFS.
            await removeFromIPFS(curr_majorHash);
        })
        .then( () => {
            console.log("MajorHash (git deleteProj): ", curr_majorHash);
            resolve({projName: projName, majorHash: curr_majorHash});
        })
        .catch ((e) => {
            reject(`main err: ${e}`);
        })
    })
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

// exclusive for deleteProj: if the barerepo of the project is not there, then its ok.
/* async function bareRepoPathCheck(barerepopath, majorHash, projName) {
    return new Promise( async (resolve, reject) => {
        if (!fs.existsSync(barerepopath)) {
            try {
                //console.log("reached barerepopathcheck");
                await getFromIPFS(majorHash, projName);
                resolve(true);
            } catch(e) {
                reject(`bareRepoPathCheck err: ${e}`);
            }
        }
        resolve(true); // means projects/bare/projName.git exists.
    })
}*/

async function projNamePathCheck(projNamepath){
    return new Promise( (resolve,reject) => {
        if (!fs.existsSync(projNamepath)){
            fs.mkdir(projNamepath, (err) => {
                if (err) { 
                    reject(`projNamePathCheck err: ${err}`);
                }
                resolve(true);
            })
        }
        resolve(true); // means projects/projName/ exists
    })
}

async function deleteProj(){
    return new Promise( async (resolve, reject) => {
        try {
            // Delete projects/projName folder:
            fs.rmdir(projNamepath, { 
                recursive: true
            }, (err) => {
                if (err) reject('(deleteProj) projName folder err:'+err);
                // Delete bare repo:
                fs.rmdir(barerepopath, { 
                    recursive: true
                }, (err) => {
                    if (err) reject('(deleteProj) barerepodelete err:'+err);
                    resolve(true);
                })
            })
        } catch(e) {
            reject(`deleteProj error: ${e}`);
        }  
    }) 
}
module.exports = router