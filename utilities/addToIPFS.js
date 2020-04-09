/**
 * UTILITY
 * For adding repository to and returning majorHash from IPFS.
 */

const globSource = require('ipfs').globSource;

// ipfs related import and setup
const ipfsClient = require('ipfs-http-client');
const ipfs = ipfsClient({host: '127.0.0.1', port: '5001'});
var majorHash = '';

module.exports = async function addToIPFS(barerepopath){
    return new Promise( async (resolve, reject) => {
        try{
            // IPFS.add() bare repo :

            await ipfs.add(globSource(barerepopath,{  // To allow hidden files - use globSource
                recursive: true,
                hidden: true
            }),async (err, results)=>{
                if (err) reject(`IPFS ADD Err: ${err}`);
                
                hash = results[results.length - 1].hash; // Access hash of only the Leader's directory (which is the last element of results)
                majorHash = hash;
                await ipfs.pin.add(hash, (err, res) => { 
                    if(err) reject(`IPFS PIN Err: ${err}`);
                    console.log("Which hash did I just pin?: ", res[0].hash); // Hash after pinning the Leader's directory.
                });
                console.log("Save this majorHash: ",majorHash);  
                resolve(majorHash);
            })
        }catch(e){
            reject(`addToIPFS err: ${e}`);
        }
    })
}