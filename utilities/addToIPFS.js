/**
 * UTILITY
 * For adding repository to and returning majorHash from IPFS.
 */

const globSource = require('ipfs').globSource;

// ipfs related import and setup
const ipfsClient = require('ipfs-http-client');
const ipfs = ipfsClient({host: '127.0.0.1', port: '5001'});
var majorHash = '';
export default async function addToIPFS(projLeader, projName){
    try{
        // IPFS.add() projectLeader's folder:
        let files = [];
        let fileobj = {
            path: `${projLeader}/${projName}`,
        }
        files.push(fileobj);
        await ipfs.add(globSource(Array.from(files),{  // To allow hidden files - use globSource
            recursive: true,
            hidden: true
        }),async (err, results)=>{
            if (err) console.log("IPFS ADD Err: ",err);
            console.log("IPFS ADD results: ",results);

            hash = results[results.length - 1].hash; // Access hash of only the Leader's directory (which is the last element of results)
            majorHash = hash;
            await ipfs.pin.add(hash, (err, res) => { 
                if(err) console.log("IPFS PIN Err: ", err);
                console.log("IPFS PIN res: ", res[0].hash); // Hash after pinning the Leader's directory.
            });
            console.log("Save this majorHash: ",majorHash);  
            return majorHash;
        })
    }catch(e){
        console.log("addToIPFS err", e);
    }
}