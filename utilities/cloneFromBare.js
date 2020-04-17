/**
 * UTILITY
 * For cloning the working dir repo after fetching bare from IPFS.
 */

// Terminal execution import
const { exec } = require('child_process');

const path = require('path');

module.exports = async function clone(projName, username, branchToUpdate) {
    
    let workdirpath = path.resolve(__dirname, '..', 'projects', projName, username);
    return new Promise( async (resolve, reject) => {
        try {
            await exec(`git clone bare/${projName+'.git'} ${projName}/${username}`,{
                cwd: path.resolve(__dirname, '..', 'projects',''),
                shell: true
            }, async (err, stdout, stderr) => {
                if (err) { console.log('clone cli err: ',err); reject(err) }
                //if (stderr) { console.log('clone cli stderr: ',stderr); reject(stderr) }
                await exec(`git checkout ${branchToUpdate}`, {
                    cwd: workdirpath,
                    shell: true
                }, (err, stdout, stderr) => {
                    console.log(`err: ${err}\nstdout: ${stdout}\nstderr: ${stderr}`);
                    resolve(true)
                }) 
            })
        } catch(e) {
            reject(e);
        }
    })
}
