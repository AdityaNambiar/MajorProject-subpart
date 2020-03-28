/*
        2. On file fetch operation in React, you will be provided with a UID.  
        3. With the help of that UID, locate the folder name (it is same as UID) in the server script file. 
            Then from that, get the directory hash for IPFS.
        4. Fill the ipfsHash state with the DirHash you imported and fetch the file.
*/
const fs = require('fs');
const ipfs = require('./ipfs');
// Required import: UID from Raj's file 
// Get the directory hash from server

// let obtainedDirHash = "";
// fs.readFile(uObj.unique_id+"/dirHashData.json", 'utf-8', (err,data) => {
//     obtainedDirHash = data.dirHash
// })
// Retrieve the file from the IPFS hash:
{/* 

// Fetch the file with the unique ID of Participant:
if (uID == 12345){
    ipfs.get('/ipfs/'+ipfsHash, (err, files) => {
        if(err) console.log("IPFS GET ERR: ", err);

    });
}
*/}
module.exports.readEvidence = function (testhash) {
    try{
        ipfs.ls('/ipfs/'+testhash, (err, files) => { // Reading the directory hash
            if (err) console.log("ERROR [ IPFS LS ]\n", err)
            
            console.log("NODE DATA [LS]: ",files);
            files.forEach(file => {     
                ipfs.cat('/ipfs/'+ file.hash, (err, file_cat) => {
                    if (err) console.log("ERROR [ IPFS CAT ]\n", err)
                    //console.log('FILES [CAT]: ',file_cat);
                    var div = document.getElementById("docres");
                    var newlink = document.createElement("a");
                    newlink.href = "https://ipfs.io/ipfs/"+file.hash;
                    newlink.innerHTML = newlink.href + "<br/>";
                    div.appendChild(newlink);
                });
            })
        })
    }
    catch(e) {
        console.log();
    }  

}