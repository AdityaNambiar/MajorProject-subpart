const fs = require('fs');
const ipfs = require('./ipfs');
var myhash = "";
async function createEvidence(filesarr){

    let files = filesarr; // Store the files array from the component 
    // +++++ UID +++++ 
    const uObj = {
        unique_id:12345 // Change this Unique ID to the one from Participant Card 
    }
    // const unique_identifier = {
    //     path: '/EvidencesDir/uniqueIdentifier.json',
    //     content: Buffer.from(JSON.stringify(uObj))
    // }

    // +++++ IPFS hash +++++
    var hash = "";
   await ipfs.add(Array.from(files),hashResult);

    function hashResult(err,results){

            if (err) { console.log("ERROR: ",err); return;}
            console.log("RESULT: ",results);
    
            hash = results[results.length-1].hash; // Access hash of only the directory
    
            /*
                1. Create object file with the the folder name as UID 
                    and the IPFS hash in a json file inside this folder.
            */
        // Make sure the uploaded files are not gc'able and saved to local IPFS repo. 
        // It will still be a hash of a directory and you'll have to access it using ipfs.cat()
            ipfs.pin.add(hash, (err, req) => { 
                if(err) console.log("PIN ERR: ", err);
                console.log("PINNED: ", req);
            });
            setHash(hash);
    }
    
    // let dirHashToStore = {
    //     dirHash: hash
    // };
    // Store the directory hash at server.
    // fs.writeFile(uObj.unique_id+"/dirHashData.json", dirHashToStore, (err) => {
    // if (err) console.log(err);
    // console.log(`Wrote Directory Hash in ${uObj.unique_id} file.`);
    // })
}
function setHash(hash){
    myhash = hash;
    
}
function getHash(){
    return myhash;
}

module.exports.createEvidence = createEvidence;
module.exports.getHash = getHash;
