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
var majorHash = '';

module.exports = async function removeFromIPFS(majorHash, projName){
    return new Promise( async (resolve, reject) => {
        try{
            // IPFS.pin.rm() projectLeader's folder:
            await ipfs.pin.rm(majorHash, (err,res) => {
                if (err) console.log("IPFS PIN RM Err: ", err);
                console.log("majorHash removed: ",res);
                execSync('ipfs repo gc', {
                    cwd: path.resolve(__dirname,'..','projects',projName),
                    shell: true,
                });
                resolve(true);
            })
        }catch(e){
            console.log("ipfs unpin & repo gc err", e);
            reject(e);
        }
    })
}