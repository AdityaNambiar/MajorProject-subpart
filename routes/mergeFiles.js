/**
 * Show the 'branch diagram' or 'git log graph' on frontend.
 */

// Misc:
const addToIPFS = require('../utilities/addToIPFS');
const getFromIPFS = require('../utilities/getFromIPFS');
const removeFromIPFS = require('../utilities/removeFromIPFS');


// Terminal execution import
const { exec } = require('child_process');

// isomorphic-git related imports and setup
const fs = require('fs');
const git = require('isomorphic-git');
git.plugins.set('fs',fs); // Bring your own file system 

const path = require('path');
const express = require('express');
const router = express.Router();


router.post('/mergeFiles',  async (req,res) => {
    const projLeader = "Aditya" // Hard coded - has to card name or from blockchain?
    var projName = "app" || req.body.projName;
    var branchName = req.body.name; // Hard coded - has to fetch as: req.body.branchName
    var majorHash = req.body.majorHash;
    // IPFS work:
    try{
        if (!fs.existsSync(path.resolve(__dirname,'..',projName))) {
            await getFromIPFS(majorHash, projLeader) // This should run first and then the below code 
            main(projLeader, projName, res, branchName, majorHash)
        } else {
            main(projLeader, projName, res, branchName, majorHash)
        }
    } catch(e) {
        console.log("mergeFiles main err: ", err);
        res.status(400).send(e);
    } 
}); 

async function main(projLeader, projName, res, branchName, majorHash) {
    // elements to cover merge conflicts:
    var conflict_files_arr = []; 
    var filename_arr = []; 
    // Git work:
    try {
        await exec('git merge '+branchName , {
            cwd: path.resolve(__dirname,'..',projLeader, projName),
            shell: true,
        }, async (err, stdout, stderr) => {
            if (err) console.log("mergeFiles err: \n", err); 
            /* NOTE ABOUT THE ERROR {  Error: Command failed: git merge f1, code: 1 / or any other than 0 integer }
             * Intentional error shows up for a merge with a 
             * conflicted paths because such a merge command returns exit status as 1 and not 0 
             * (0 = successful, anything other than 0 = non-succesful => check by typing '$?' on terminal)
            */
            if (stderr) console.log("mergeFiles stderr: \n", err);
            conflict_files_arr = stdout.split('\n');
            console.log(conflict_files_arr);
            
            var elem_rgx = RegExp(/CONFLICT/);
            //console.log(conflict_files_arr.some((e) => elem_rgx.test(e)));
            if (conflict_files_arr.some((e) => elem_rgx.test(e))){ // Check if there is any "conflict" line on output
                var filename_rgx = RegExp(/([a-zA-Z0-9]+)\.[a-zA-Z0-9]+/);
                conflict_files_arr.forEach((elem) => {
                    if (elem_rgx.test(elem)){ // If we get a conflicted element.
                        var filename = filename_rgx.exec(elem)[0]
                        filename_arr.push(filename);
                    }
                })
            }
            console.log(filename_arr);
            var oldmajorHash = majorHash;
            // Store new state of git repo:
            majorHash = await addToIPFS(projLeader,projName);
            // Prevent cluttering IPFS repo by unpinning old states of repo:
            await removeFromIPFS(oldmajorHash, projLeader, projName);
            console.log("Updated MajorHash (git merge): ",majorHash);
            res.status(200).send({
                projName: projName, 
                majorHash: majorHash, 
                filename_arr: filename_arr
            });
        });
    }catch(e){
        console.log("mergeFiles git err: ",e);
        res.status(400).send(e);
    }
}
module.exports = router