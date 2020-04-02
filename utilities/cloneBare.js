/**
 * UTILITY
 * For cloning the bare git repo after fetching from IPFS.
 */

// Terminal execution import
const { exec } = require('child_process');

const path = require('path');

module.exports = async function clone(projName) {
    return new Promise( async (resolve, reject) => {
        try {
            await exec(`git clone --bare ${projName} ${projName+'.git'}`,{
                cwd: path.resolve('projects'),
                shell: true
            }, (err, stdout, stderr) => {
                if (err) { console.log('clone cli err: ',err); reject(err) }
                if (stderr) { console.log('clone cli stderr: ',stderr); reject(stderr) }
                resolve(true)
            })
        } catch(e) {
            reject(e);
        }
    })
}
