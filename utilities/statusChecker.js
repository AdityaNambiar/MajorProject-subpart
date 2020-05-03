/**
 * - `git fetch`
 * - `git status`:-
 *      - Extract the line the "This branch is ahead / behind n commits ...."
 *      - Different lines are:
 *          -- (default) Your branch is up to date with 'origin/master'.
 *          -- Your branch and 'origin/master' have diverged,
 *          -- Your branch is ahead of 'origin/master'
 *          -- Your branch is behind 'origin/master' by 1 commit.
 */

// Terminal execution:
const { exec } = require('child_process');

// isomorphic-git related imports and setup
const fs = require('fs');
const git = require('isomorphic-git');
git.plugins.set('fs',fs); // Bring your own file system 

module.exports = async function statusChecker(barerepopath, branchNamepath, username, timestamp) {
    return new Promise( async (resolve, reject) => {
        await scan(branchNamepath, username, timestamp)
        .then( async (computedpath) => {
            await gitFetch(barerepopath, computedpath)
            return computedpath;
        })
        .then( async (computedpath) => {
            let statusLine = await gitStatus(computedpath)
            return statusLine;
        })
        .then( (statusLine) => {
            resolve(statusLine);
        })
        .catch((e) => {
            reject(`main err: ${e}`);
        })
    })
}

async function scan(branchNamepath, username, timestamp){
    var tsarr = [], filesarr = [], minOftsarr, computedpath;
    return new Promise( async (resolve, reject) => {
        try {
            fs.readdir(branchNamepath,(err,files)=>{
                if (err) reject(`readdir err: ${err}`)
                filesarr = files.filter(e => !e.search(username)); // Only fetch current user's folders (username+timestamp folder).
                for (var i = 0; i < filesarr.length; i++) {
                    var str = filesarr[i]; // username+timestamp
                    var ts = parseInt(str.split(username)[1]); // timestamp of type "number".
                    tsarr.push(ts);
                }    
                console.log(tsarr);
                minOftsarr = tsarr.reduce( (a,b) => (a < b)? a : b);  // Fetch minimum of the timestamp arr.
                computedpath = path.resolve(branchNamepath, username+minOftsarr);
            })
        } catch(e) {
            reject(`(scan) fs.readdir err: ${e}`)
        }
    })
}

async function gitFetch(barerepopath, workdirpath) {
    return new Promise (async (resolve, reject) => {
        try {
            exec(`git fetch ${barerepopath} master`, {
                cwd: workdirpath,
                shell: true
            }, (err, stdout, stderr) => {
                if (err) { 
                    reject(`git-fetch cli err: ${err}`);
                }
                // if (stderr) {
                //     reject(`git-fetch cli stderr: ${stderr}`);
                // }
                resolve(true);
            })
        } catch(e) {
            reject(`get-fetch caught err: ${e}`);
        }
    })
}

async function gitStatus(workdirpath) {
    return new Promise (async (resolve, reject) => {
        try {
            exec(`git status`, {
                cwd: workdirpath,
                shell: true
            }, (err, stdout, stderr) => {
                if (err) { 
                    reject(`git-status cli err: ${err}`);
                }
                if (stderr) {
                    reject(`git-status cli stderr: ${stderr}`);
                }
                //console.log(stdout);
                let statusLine = stdout.trim().split('\n')[1];
                resolve(statusLine);    
            })
        } catch(e) {
            reject(`get-status caught err: ${e}`);
        }
    })
}
