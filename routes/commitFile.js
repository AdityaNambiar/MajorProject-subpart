/**
 * Commit files to git repository.
*/

// Misc:
const preRouteChecks = require('../utilities/preRouteChecks');
const pushChecker = require('../utilities/pushChecker');

// isomorphic-git related imports and setup
const fs = require('fs');
const git = require('isomorphic-git'); 

const path = require('path');
const express = require('express');
const router = express.Router();

router.post('/commitFile', async (req,res) => {
    var projName = req.body.projName;
    var username = req.body.username;
    var branchToUpdate = req.body.branchToUpdate;
    var curr_majorHash = req.body.majorHash; // latest
    var url = `'http://localhost:7005/projects/bare/${projName}.git'`;
    
    var authorname = req.body.authorname;
    var authoremail = req.body.authoremail;
    var usermsg = req.body.usermsg;
    var filename = req.body.filename; // Maybe you dont need ".replace(/\s/g,'-')" here. Means it should allow having spaces in filenames.
    var buffer = req.body.filebuff;
    
    var timestamp = Date.now();

    // Git work:
    var barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git'); 
    var workdirpath = path.resolve(__dirname, '..', 'projects', projName, branchToUpdate, username+timestamp);

    try {
        await preRouteChecks(curr_majorHash, projName, username, timestamp, branchToUpdate)
        let response = await main(projName, timestamp, barerepopath, buffer,
                                workdirpath, curr_majorHash, url,
                                filename, usermsg, authorname, authoremail)
        res.status(200).send(response);
    } catch (err) {
        console.log(err);
        res.status(400).send(`(commitFile) err ${err.name} :- ${err.message}`);
    }
})

async function main(projName, timestamp, barerepopath, buffer,
                    workdirpath, curr_majorHash, url,
                    filename, usermsg, authorname, authoremail){
    try {
        await writeFile(workdirpath, filename, buffer)
        await autoCommit(workdirpath,filename, usermsg, authorname, authoremail)
        const responseobj = await pushChecker(barerepopath, workdirpath, timestamp, curr_majorHash)
                            // .catch( async (err) => { // If ever you want to perform a cleanUp for removeFromIPFS error, refine this catch block so that it can actually catch that error and remove the current workDir.
                            //     console.log(err);
                            //     await rmWorkdir(workdirpath); // Remove the workdir folder from old branchNamePath
                            //     reject(new Error(`(pushChecker) err ${err.name} :- ${err.message}`)); 
                            // });
        console.log("pushchecker returned this: \n", responseobj);
        return ({
            projName: projName, 
            majorHash: responseobj.ipfsHash, 
            statusLine: responseobj.statusLine, 
            mergeArr: responseobj.mergeObj, 
            url: url
        });
    } catch(err) {
        console.log(err);
        throw new Error(`(commitFile) main err ${err.name} :- ${err.message}`);
    }
}
            

async function autoCommit(workdirpath, filename, usermsg, authorname, authoremail){
        try {
            await git.add({
                fs: fs,
                dir:  workdirpath,
                filepath: filename
            })
            let sha = await git.commit({
                    fs: fs,
                    dir:  workdirpath,
                    message: usermsg,
                    author: {
                        name: authorname,
                        email: authoremail
                    }
                })
            console.log("commit hash: \n",sha);
            return(true);
        } catch(err) {
            throw new Error(`(commitFile) git-commit err ${err.name}: ${err.message}`);
        }
}

async function writeFile(workdirpath, filename, buffer) {
    fs.writeFile(path.resolve(workdirpath, filename), Buffer.from(buffer), (err) => {
            if (err) { console.log(err); throw new Error(`(commitFile) fs write err ${err.name} :- ${err.message} `); }
            return Promise.resolve(true);
    })
}

module.exports = router;