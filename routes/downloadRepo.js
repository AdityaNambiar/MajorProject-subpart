/**
 * Download the repository (the one with working directory - the normal one)
 * https://localhost:7005/projName.git <- URL. 
 * res.status(200).send(url).
 */

const { zip } = require('zip-a-folder');
// isomorphic-git related imports and setup
const fs = require('fs');
const git = require('isomorphic-git');
git.plugins.set('fs',fs); // Bring your own file system 

const path = require('path');
const express = require('express');
const router = express.Router();

var projName, workdirpath, curr_majorHash, 
    username, branchToUpdate, projNamepath,
    upstream_branch, majorHash, barerepopath, 
    filenamearr = [], statusLine;

router.post('/downloadRepo', async (req,res) => {
    projName = req.body.projName.replace(/\s/g,'-') || 'app1';
    username = req.body.username.replace(/\s/g,'-') || 'ap2';
    curr_majorHash = req.body.majorHash || null;  // latest
    branchToUpdate = req.body.branchToUpdate.replace(/\s/g,'-') || null;
    upstream_branch = 'origin/master';
    barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git'); 
    workdirpath = path.resolve(__dirname, '..', 'projects', projName, username);
    
    projNamepath = path.resolve(__dirname, '..', 'projects', projName+'.zip');

    try{
        await preRouteChecks(curr_majorHash, projName, username, branchToUpdate)
        .then( async () => {
            await zip(workdirpath, projNamepath)
        })
        .then( async () => {
            await rmWorkdir(projName, username);
        })
        .then ( () => {
            res.download(path.resolve(__dirname,'..','projects',`${projName}.zip`),(err)=> {
                if (err) {
                    res.status(400).send(`Could not download workdir repo: \n ${err}`);
                } 
            })
        })
    }catch(e){
        res.status(400).send(`main caller err: ${e}`);
    }
})

module.exports = router;