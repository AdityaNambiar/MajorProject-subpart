/**
 * UTILITY
 * For getting repository from IPFS
 */

// Terminal execution import
const { exec } = require('child_process');

const path = require('path');

// ipfs related import and setup
const ipfsClient = require('ipfs-http-client');
const ipfs = ipfsClient({host: '127.0.0.1', port: '5001'});

module.exports = function getFromIPFS(majorHash, projName){
    return new Promise( async (resolve, reject) => {
        try {
            await ipfs.get(majorHash, async (err, results) => {
                if (err) throw new Error("ipfs.get err: \n", err);
                var leader_dirpathhash = results[0].path
                await exec(`ipfs get ${leader_dirpathhash} -o ${projName+'.git'}`, {
                    cwd: path.resolve(__dirname,'..'),
                    shell: true,
                }, (err,stderr, stdout) => {
                    if (err) console.log(err);
                    if (stderr) console.log(stderr);
                    console.log(stdout);
                });
                resolve(true);
            });
        } catch (e) {
            reject(e);
        }
    })        
}
