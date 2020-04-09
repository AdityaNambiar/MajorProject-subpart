/**
 * A utility that just implement `git push path(projects/projName.git) master` - bare repo path.
 * 
 * 1. implement node-git-server for listening to push cli event (placed in index.js so that the node-git-server starts with normal IPFS server)
 * 2. repos.on('push', < perform a pushToBare() >)
 */

const path = require('path');

let workdirpath, barerepopath;

module.exports = function pushToBare(projName, branchName) {

    barerepopath = path.resolve(__dirname, '..', 'projects', projName+'.git'); 
    workdirpath = path.resolve(__dirname,'..','projects',projName);

    return new Promise( async (resolve, reject) => {
        await exec(`git push ${barerepopath} ${branchName} `, {
            cwd: workdirpath,
            shell: true
        }, (err, stdout, stderr) => {
            if (err) reject(`git push cli ${err}`) 
            if (stderr) reject(`git push cli ${stderr}`) 
            console.log('git push cli stdout: ',stdout)
            resolve(true);
        })
        
    })
}