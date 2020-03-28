/**
 * UTILITY
 * For getting repository from IPFS
 */

// ipfs related import and setup
const ipfsClient = require('ipfs-http-client');
const ipfs = ipfsClient({host: '127.0.0.1', port: '5001'});

module.exports.getFromIPFS = async function getFromIPFS(majorHash, projLeader){
    await ipfs.get(majorHash, async (err, results) => {
        if (err) throw new Error("ipfs.get err: \n", err);
        var leader_dirpathhash = results[0].path
        execSync(`ipfs get ${leader_dirpathhash} -o ${projLeader}`, {
            cwd: __dirname,
            shell: true,
        });
    });
}