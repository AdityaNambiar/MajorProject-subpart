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

let barepath;

module.exports = function getFromIPFS(majorHash, projName){
    barepath = path.resolve(__dirname, '..', 'projects', 'bare');
    return new Promise( async (resolve, reject) => {
        try {
            await exec(`ipfs get ${majorHash} -o ${projName+'.git'}`, {
                cwd: barepath,
                shell: true,
            }, async (err,stdout,stderr) => {
                if (err) reject('ipfs get cli err: '+err) 
                //if (stderr) reject('ipfs get cli stderr: '+stderr)
                resolve(true);
            })
        } catch (e) {
            reject(e);
        }
    })        
}
