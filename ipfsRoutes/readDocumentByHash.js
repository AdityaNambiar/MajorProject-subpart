const ipfsClient = require('ipfs-http-client');
const ipfs = ipfsClient('0.0.0.0', '5001');
const express = require('express');
const path = require('path');
const router = express.Router();
const fs = require('fs');

router.post('/readDocumentByHash',(req,res)=>{
    let caseDocumentHash = req.body.caseDocumentHash;
    const hashList = caseDocumentHash;
    try {
        var fnl;
        for (var i = 0; i < hashList.length; i++);
            fnl = await scanIPFSDir(hash);
        res.status(200).send(fnl)
    } catch (err) {
        console.log(err);
        res.status(400).send(`(readDocument) res err ${err.name} :- ${err.message} `)
    }
});

    


function scanIPFSDir(hash) {
    return new Promise( (resolve, reject) => {
        try {
            ipfs.ls(hash, async (err, files) => {
                if (err) {
                    console.log(err);
                    reject(new Error(`(scanIPFSDir) ipfs.ls API err ${err.name} :- ${err.message}`));
                }
                var fnl = await makeFileBuffer(files, hash);
                console.log(fnl);
                resolve(fnl);
            });
        } catch(err) {
            console.log(err);
            reject(new Error(`(scanIPFSDir) ipfs-ls err ${err.name} :- ${err.message}`));
        }
    })
}
async function makeFileBuffer(files, hash) {
    try{
        var fnl = [], filesCount = 0;
        for (let i = 0; i < files.length; i++){
            fnl.push(await ipfscat(hash, files[i]));
            //console.log(fnl);
        }
        return(fnl);
    } catch (err) {
        console.log(err);
        throw new Error(`(makeFileBuffer) ipfs-cat err ${err.name} :- ${err.message}`);
    }
}

function ipfscat(hash, file) {

    var fileobj = {};
    return new Promise( (resolve, reject) => {
        //console.log(file, hash);
        try {
            ipfs.cat(file.hash, (err, file_cat) => {
                if (err) {
                    console.log(err);
                    reject(new Error(`(ipfscat) ipfs.cat API err ${err.name} :- ${err.message}`))
                }
                let fileExt = file.name.substr(file.name.lastIndexOf('.') + 1);
                fileobj = { "name": file.name, "extension": fileExt, "fileHash": file.hash, "majorHash": hash };
                //console.log(filenamelist);
                resolve(fileobj);
            });
        } catch(err) {
            console.log(err);
            reject(new Error(`(ipfscat) ipfs-cat err ${err.name} :- ${err.message}`));
        }
    })
}
module.exports = router;
