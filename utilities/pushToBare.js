/**
 * A utility that just implement `git push path(projects/projName) master` - repo path.
 * 
 * 1. implement node-git-server for listening to push cli event (placed in index.js so that the node-git-server starts with normal IPFS server)
 * 2. repos.on('push', < perform a push to normal 
 */


// isomorphic-git related imports and setup
const fs = require('fs');
const git = require('isomorphic-git');
git.plugins.set('fs',fs); // Bring your own file system 

const path = require('path');


module.exports = function pushToRepo(remoteurl,projName, branchName) {
    return new Promise( async (resolve, reject) => {
        await exec(`git push ${remoteurl} ${branchName} `, {
            cwd: path.resolve(__dirname,'..','projects',projName),
            shell: true
        }, (err, stdout, stderr) => {
            if (err) { console.log('git push cli err: ',err); reject(err) }
            if (stderr) { console.log('git push cli stderr: ',stderr); reject(err) }
            console.log('git push cli',stdout)
            resolve(true);
        })
        
    })
}