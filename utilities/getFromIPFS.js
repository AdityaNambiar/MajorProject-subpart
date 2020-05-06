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

module.exports = function getFromIPFS(majorHash, projName){
    
    let barepath = path.resolve(__dirname, '..', 'projects', 'bare');
    return new Promise((resolve, reject) => {
        try {
            exec(`ipfs get '${majorHash}' -o '${projName+'.git'}'`, {
                cwd: barepath,
                shell: true,
            },(err,stdout,stderr) => {
                if (err) { console.log(err); reject(new Error(`ipfs get cli err ${err.name} :- ${err.message}`)); } 
                if (stderr) { console.log(stderr); reject(new Error('ipfs get cli stderr: '+stderr)) }
                resolve(true);
            })
        } catch (err) {
            console.log(err); 
            reject(new Error(`ipfs get err ${err.name} :- ${err.message}`));
        }
    })        
}
