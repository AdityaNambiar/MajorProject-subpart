/**
 * Download the repository (the one with working directory - the normal one)
 * https://localhost:7005/projName.git <- URL. 
 * res.status(200).send(url).
 */

const preRouteChecks = require('../utilities/preRouteChecks');
const rmWorkdir = require('../utilities/rmWorkdir');

const { zip } = require('zip-a-folder');
// isomorphic-git related imports and setup
const fs = require('fs');
const git = require('isomorphic-git'); 

const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const app = express();

app.use(bodyParser.json());

router.post('/downloadRepo', async (req,res) => {
    var projName = req.body.projName; 
    var username =  req.body.username;
    var branchToUpdate =  req.body.branchToUpdate;
    var curr_majorHash = req.body.majorHash;  // latest
    
    var timestamp = Date.now();
    var workdirpath = path.resolve(__dirname, '..', 'projects', projName, branchToUpdate, username+timestamp);
    
    var projNamepath = path.resolve(__dirname, '..', 'projects', projName+'.zip');

    try{
        await preRouteChecks(curr_majorHash, projName, username, timestamp, branchToUpdate)
        await zip(workdirpath, projNamepath)
        await rmWorkdir(workdirpath);
        res.download(path.resolve(__dirname,'..','projects',`${projName}.zip`),(err)=> {
            if (err) {
                console.log(err);
                res.status(400).send(`(downloadRepo) res-download err ${err.name} :- ${err.message}`);
            } 
        })
    }catch(err){
        console.log(err);
        res.status(400).send(`(downloadRepo) err ${err.name} :- ${err.message}`);
    }
})

module.exports = router;