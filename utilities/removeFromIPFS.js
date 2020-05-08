/**
 * UTILITY
 * For unpinning and running 'ipfs repo gc' on folder to erase majorHash from IPFS (local repo only).
 */

// Terminal execution import
const { exec } = require('child_process');

const path = require('path');

// ipfs related import and setup
const ipfsClient = require('ipfs-http-client');
const ipfs = ipfsClient({host: '127.0.0.1', port: '5001'});

module.exports = function removeFromIPFS(majorHash){

    var projectsPath = path.resolve(__dirname, '..', 'projects'); 
    return new Promise( (resolve, reject) => {
        try{
            exec(`ipfs pin rm ${majorHash}; ipfs repo gc;`, {
                cwd: projectsPath,
                shell: true,
            }, (err, stdout, stderr) => {
                if (err){
                    console.log(err);
                    reject(new Error(`(removeFromIPFS) cli err ${err.name} :- ${err.message}`))
                }
                if (stderr){
                    console.log(stderr);
                    reject(new Error(`(removeFromIPFS) cli stderr :- ${err.message}`))
                }
                console.log(stdout);
                resolve(true);
            });
        }catch(err){
            console.log(err); 
            reject(new Error(`(removeFromIPFS) err ${err.name} :- ${err.message}`));
        }
    })
}