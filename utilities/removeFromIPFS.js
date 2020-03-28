/**
 * UTILITY
 * For unpinning and running 'ipfs repo gc' on folder to erase majorHash from IPFS (local repo only).
 */

// ipfs related import and setup
const ipfsClient = require('ipfs-http-client');
const ipfs = ipfsClient({host: '127.0.0.1', port: '5001'});
var majorHash = '';

module.exports.removeFromIPFS = async function removeFromIPFS(projLeader, projName){
    try{
        // IPFS.pin.rm() projectLeader's folder:
        await ipfs.pin.rm(majorHash, (err,res) => {
            if (err) console.log("IPFS PIN RM Err: ", err);
            console.log("majorHash removed: ",res);
            var execout = execSync('ipfs repo gc', {
                cwd: path.join(__dirname, projLeader, projName),
                shell: true,
            });
            console.log(execout);
        })
    }catch(e){
        console.log("ipfs unpin & repo gc err", e);
    }
}