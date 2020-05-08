const ipfsClient = require('ipfs-http-client');
const ipfs = ipfsClient('0.0.0.0', '5001');
const express = require('express');
const path = require('path');
const router = express.Router();
const fs = require('fs');

router.post('/readDocumentByHash',(req,res)=>{


try{

    var filesBuffer = [];
    let caseDocumentHash = req.body.caseDocumentHash;
    const hashList = caseDocumentHash;
    hashList.forEach((hash,i)=>{
        counter = i+1;
        ipfs.ls('/ipfs/'+hash,(err,files)=>{
            let flen = files.length;
            if (err) {
                console.log(err);
                reject(new Error(`(readDocumentByHash) ipfs.ls API err ${err.name} :- ${err.message}`));
            }
            files.forEach((file,j) => {     
        
            ipfs.cat('/ipfs/'+ file.hash, (err, file_cat) => {
                if (err) console.log("ERROR [ IPFS CAT ]\n", err)
                let fileExt = file.name.substr(file.name.lastIndexOf('.')+1);
               filesBuffer.push({"name":file.name,"extension":fileExt,"fileHash":file.hash,"majorHash":hash}); 
            });
            
        });

        });
    });

var myVar =  setInterval(check,1200);

function check(){
if(filesBuffer.length!==0){
   clearInterval(myVar);
   // console.log(filesBuffer.length)
   
//    res.status(200).send({"fileLength":filesBuffer.length})
   return res.status(200).send(JSON.stringify(filesBuffer))
//    console.log(filesBuffer);
//    console.log(filesBuffer.length)

}
}   

}catch(error){
    res.status(400).send(error.toString());
}
});

    

module.exports = router;
