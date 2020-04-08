/**
 * UTILITY
 * For getting repository from IPFS
 * 
 * 1. Perform a IPFS get on the majorHash. Since its a directory hash, we need to first do 
 */

// Terminal execution import
const { exec } = require('child_process');

const path = require('path');

// ipfs related import and setup
const ipfsClient = require('ipfs-http-client');
const ipfs = ipfsClient({host: '127.0.0.1', port: '5001'});


let barerepopath = path.resolve(__dirname, '..', 'projects');

module.exports = function getFromIPFS(majorHash, projName){

    return new Promise( async (resolve, reject) => {
        try {
            await ipfs.get(majorHash, async (err, results) => {
                if (err) throw new Error("ipfs.get err: \n", err);
                var leader_dirpathhash = results[0].path

                await exec(`ipfs get ${leader_dirpathhash} -o ${projName+'.git'}`, {
                    cwd: barerepopath,
                    shell: true,
                }, async (err,stdout,stderr) => {
                    if (err) { console.log('ipfs get cli err: ',err); reject(err) }
                    if (stderr) { console.log('ipfs get cli stderr: ',stderr); reject(err) }
                    resolve(true);
                });

            });
        } catch (e) {
            reject(e);
        }
    })        
}
