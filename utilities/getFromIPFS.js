/**
 * UTILITY
 * For getting repository from IPFS
 */

// Terminal execution import
const { execSync } = require('child_process');

const path = require('path');

// ipfs related import and setup
const ipfsClient = require('ipfs-http-client');
const ipfs = ipfsClient({host: '127.0.0.1', port: '5001'});

module.exports = function getFromIPFS(majorHash, projLeader){
    return new Promise( async (resolve, reject) => {
        try {
            await ipfs.get(majorHash, (err, results) => {
                if (err) throw new Error("ipfs.get err: \n", err);
                var leader_dirpathhash = results[0].path
                execSync(`ipfs get ${leader_dirpathhash} -o ${projLeader}`, {
                    cwd: path.resolve(__dirname,'..'),
                    shell: true,
                });
                resolve(true);
            });
        } catch (e) {
            reject(e);
        }
    })        
}
