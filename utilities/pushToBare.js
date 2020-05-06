/**
 * A utility that just implement `git push path(projects/projName.git) master` - bare repo path.
 * 
 * 1. implement node-git-server for listening to push cli event (placed in index.js so that the node-git-server starts with normal IPFS server)
 * 2. repos.on('push', < perform a pushToBare() >)
 */

const { exec } = require('child_process');

module.exports = function pushToBare(barerepopath, workdirpath, branchName) {

    return new Promise((resolve, reject) => {
        exec(`git push '${barerepopath}' '${branchName}' `, {
            cwd: workdirpath,
            shell: true
        }, (err, stdout, stderr) => {
            if (err) {
                /*let err_arr = err.toString().split('\n');
                if (err_arr.some( (e) => e == `fatal: ${branchName} cannot be resolved to branch`)) 
                resolve(true)
                else  */
                console.log(err);
                reject(new Error(`git push cli err ${err.name}: ${err.message}`));
            }
            //if (stderr) reject(`git push cli stderr: ${stderr}`) 
            console.log('git push cli stdout: ',stdout)
            resolve(true);
        })
        
    })
}