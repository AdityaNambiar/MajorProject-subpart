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
    return new Promise( async (resolve, reject) => {
        try{
            // IPFS.pin.rm() projectLeader's folder:
            await ipfs.pin.rm(majorHash, (err,res) => {
                if (err) console.log("IPFS PIN RM Err: ", err);
                console.log("majorHash removed: ",res);
                execSync('ipfs repo gc', {
                    cwd: projectsPath,
                    shell: true,
                });
                resolve(true);
            })
        }catch(e){
            reject("ipfs unpin & repo gc err"+e);
        }
    })
}