/**
 * UTILITY
 * For cloning the working dir repo after fetching bare from IPFS.
 */

// Terminal execution import
const { exec } = require('child_process');

const path = require('path');

module.exports = function clone(workdirpath, projName, username, timestamp, branchToUpdate) {
    
    return new Promise((resolve, reject) => {
        try {
            exec(`git clone 'bare/${projName+'.git'}' '${projName}/${branchToUpdate}/${username+timestamp}'`,{
                cwd: path.resolve(__dirname, '..', 'projects',''),
                shell: true
            }, (err, stdout, stderr) => {
                if (err) { console.log(err); reject(new Error(`(cloneFromBare) clone cli err ${err.name} :- ${err.message}`)); }
                //if (stderr) { console.log('clone cli stderr: ',stderr); reject(stderr) }
                exec(`git checkout '${branchToUpdate}'`, {
                    cwd: workdirpath,
                    shell: true
                }, (err, stdout, stderr) => {
                    //console.log(`err: ${err}\nstdout: ${stdout}\nstderr: ${stderr}`);
                    resolve(true)
                }) 
            })
        } catch(err) {
            console.log(err); 
            reject(new Error(`(cloneFromBare) git clone err ${err.name} :- ${err.message}`));
                
        }
    })
}
