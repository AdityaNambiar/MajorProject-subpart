/**
 * Show the 'branch diagram' or 'git log graph' on frontend.
 */

// Misc:
const getFromIPFS = require('../utilities/getFromIPFS');

// Terminal execution import
const { exec } = require('child_process');

// isomorphic-git related imports and setup
const fs = require('fs');
const git = require('isomorphic-git');
git.plugins.set('fs',fs); // Bring your own file system 

const path = require('path');
const express = require('express');
const router = express.Router();


router.post('/mergeFiles', (req,res) => {
    const projLeader = "Aditya" // Hard coded - has to card name or from blockchain?
    var projName = "app" || req.body.projName;
    var branchName = 'feature' || req.body.name; // Hard coded - has to fetch as: req.body.branchName
    var majorHash = '';

    // elements to cover merge conflicts:
    var conflict_files_arr = []; 
    var filename_arr = []; 
    // IPFS work:
    try{
        fs.exists(path.resolve(__dirname,'..',projLeader,projName), async (exists) => 
        { 
            if (!exists) getFromIPFS(majorHash); 
            else {
                // Git work:
                try {
                    exec('git merge '+branchName , {
                        cwd: path.join(__dirname),
                        shell: true,
                    }, (err, stdout, stderr) => {
                        if (err) console.log("mergeFiles err: \n", err);
                        if (stderr) console.log("mergeFiles stderr: \n", err);
                        console.log("RESULTS: \n",stdout);
                        conflict_files_arr = stdout.split('\n');
                        console.log(conflict_files_arr);
                        
                        var elem_rgx = RegExp(/CONFLICT/);
                        var filename_rgx = RegExp(/([a-zA-Z0-9]+)\.[a-zA-Z0-9]+/);
                        conflict_files_arr.forEach((elem) => {
                            if (elem_rgx.test(elem)){ // If we get a conflicted element.
                                 var filename = filename_rgx.exec(elem)[0]
                                 filename_arr.push(filename);
                            }
                        })

                        console.log(filename_arr);
                    });
                    res.status(200).send(execout);
                }catch(e){
                    console.log("mergeBranch git err: ",e);
                    res.status(400).send(e);
                }
            }
        })
    } catch(e) {
        console.log("mergeBranch main err: ", err);
        res.status(400).send(e);
    } 
}); 

module.exports = router