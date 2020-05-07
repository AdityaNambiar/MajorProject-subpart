/** 
 * Download the repository (the one with working directory - the mergeid one)
 * -- take mergeid 
 * -- zip that folder and send for download (like in downloadRepo)
 * -- remove the folder of this name (branchNamepath/mergeid).
 * 
 */

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


router.post('/downloadForCLI', async (req,res) => {
    var projName = req.body.projName; 
    //var username =  req.body.username;
    //var curr_majorHash = req.body.majorHash;  // latest
    var mergeobj = req.body.mergeobj;
    var branchToUpdate = '';
    var title = mergeobj.title;
    // Using Regex to avoid vigorously checking to make sure if its type is branch or pull because there's type special as well. 
    var rgxForBranch = /Merge conflict raised when merging/
    var rgxForPull = /Merge conflict raised pulling/
    if (rgxForBranch.test(title))
        branchToUpdate = title.split("merging ")[1].split(" into ")[1]; // Destination branch name (where it should be left out)
    if (rgxForPull.test(title))
        branchToUpdate = str.split("pulling ")[1].split(" branch")[0];

    var mergeid = mergeobj.mergeid;

    var workdirpath = path.resolve(__dirname, '..', 'projects', projName, branchToUpdate, mergeid);
    var projNamepath = path.resolve(__dirname, '..', 'projects', projName+'.zip');

    try{
        await zip(workdirpath, projNamepath)
        await rmWorkdir(workdirpath);
        res.download(path.resolve(__dirname,'..','projects',`${projName}.zip`),(err)=> {
            if (err) {
                console.log(err);
                res.status(400).send(`(downloadAndRemoveRepo) res-download err ${err.name} :- ${err.message}`);
            } 
        })
    }catch(err){
        console.log(err);
        res.status(400).send(`(downloadAndRemoveRepo) err ${err.name} :- ${err.message}`);
    }
})

module.exports = router;