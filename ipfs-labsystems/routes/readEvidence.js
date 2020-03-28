const ipfsClient = require('ipfs-http-client');
const ipfs = ipfsClient('labsys-ipfs', '5001');
const express = require('express');
const path = require('path');
const router = express.Router();
const fs = require('fs');

router.post('/',(req,res)=>{


try{

    var filesBuffer = [];
    var obtainedDirHashList = "";
   
    
    let unique_id = req.body.cardName;
    let evidenceKey = req.body.evidenceKey;
    console.log(unique_id,evidenceKey)
    // let unique_id = "admin@labsystems"
    let dir = path.join(__dirname,`../${unique_id}/${evidenceKey}/`);
    obtainedDirHashList =  fs.readFileSync(dir+"dirHashData.json", 'utf-8');
    const hashList = JSON.parse(obtainedDirHashList).dirHash;
    hashList.forEach((hash,i)=>{
        counter = i+1;
        ipfs.ls('/ipfs/'+hash,(err,files)=>{
            let flen = files.length;
            if (err) console.log("ERROR [ IPFS LS ]\n", err)
        //console.log("NODE DATA [LS]: ",files);
        files.forEach((file,j) => {     
        
            ipfs.cat('/ipfs/'+ file.hash, (err, file_cat) => {
                if (err) console.log("ERROR [ IPFS CAT ]\n", err)
                //console.log('FILES [CAT]: ',file_cat);
            //    filesBuffer.push({"name":file.name,"buffer":file_cat,"filehash":file.hash,"majorHash":hash});
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
console.log("Files' Buffer: \n",filesBuffer);
   res.status(200).send(JSON.stringify(filesBuffer))
//    console.log(filesBuffer);
//    console.log(filesBuffer.length)

}
}   

}catch(error){
    res.status(400).send(error.toString());
}
});

    

module.exports = router;