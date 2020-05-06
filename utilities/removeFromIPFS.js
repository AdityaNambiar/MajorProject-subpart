/**
 * UTILITY
 * For unpinning and running 'ipfs repo gc' on folder to erase majorHash from IPFS (local repo only).
 */

// Terminal execution import
const { execSync } = require('child_process');

const path = require('path');

// ipfs related import and setup
const ipfsClient = require('ipfs-http-client');
const ipfs = ipfsClient({host: '127.0.0.1', port: '5001'});

module.exports = function removeFromIPFS(majorHash){

    var projectsPath = path.resolve(__dirname, '..', 'projects'); 
    return new Promise( (resolve, reject) => {
        try{
            // IPFS.pin.rm() projectLeader's folder:
            ipfs.pin.rm(majorHash, (err,res) => {
                if (err) { console.log(err); reject(new Error(`(removeFromIPFS) Err ${err.name} :- ${err.message}`)); }
                console.log("majorHash removed: ",res);
                execSync('ipfs repo gc', {
                    cwd: projectsPath,
                    shell: true,
                });
                resolve(true);
            })
        }catch(err){
            console.log(err); 
            reject(new Error(`(removeFromIPFS) err ${err.name} :- ${err.message}`));
        }
    })
}