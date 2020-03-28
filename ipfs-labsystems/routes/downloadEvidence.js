/**
 * The only purpose of this file is to read the hashes and pass data buffer 
 * in the response object.
 * 
 * majorHash = directory hash
 * fileHash = one of the hashes of a file
 */
const ipfsClient = require('ipfs-http-client');
const ipfs = ipfsClient('labsys-ipfs', '5001');
const express = require('express');
const path = require('path');
const router = express.Router();
const fs = require('fs');
const stream = require('stream');
router.post('/',(req,res)=>{


try{

    let fileHash = req.body.fileHash;
    let majorHash = req.body.majorHash;
    let fileName = req.body.name;

    // let fileHash = "QmX8phFHQiovvNKrarxxeXhcJbRNwVWQVkXzhA5x3s3CL1"
    // let majorHash = "QmQHmhB6YCZTTNHVbcTFCZx146zpkwxB142f9JajvYnN3c"
    // let fileName = "AI MODULE3.doc";
        ipfs.ls('/ipfs/'+majorHash,(err,files)=>{
            if (err) console.log(err);     
                
                ipfs.cat('/ipfs/'+ fileHash, (err, file_cat) => {
                    if (err) console.log("ERROR [ IPFS CAT ]\n", err)
                    //console.log('FILES [CAT]: ',file_cat);
                //    filesBuffer.push({"name":file.name,"buffer":file_cat,"filehash":file.hash,"majorHash":hash}); 
                //    console.log({"buffer":file_cat});
                //    let fileContents = Buffer.from(file_cat,"base64");
                //    let savedFilePath = '/temp/'+ fileName;
                // let savedFilePath = path.join(__dirname,`../temp/${fileName}`);
                //    fs.writeFile(savedFilePath,fileContents,function(){
                //        res.status(200).download(savedFilePath,fileName);
                //    }
                
                // let fileContents = Buffer.from(file_cat, "base64");
                // let readStream = new stream.PassThrough();
                // readStream.end(fileContents);  
                // res.set('Content-disposition', 'attachment; filename=' + fileName);
                // res.set('Content-Type', 'text/plain');
                // readStream.pipe(res);
                   res.send(file_cat)
                // let arrByte=  Uint8Array.from(Buffer.from(file_cat))
                // let binaryData= new Blob([arrByte]);
                    // res.status(200).send(arrByte)
                });
                
            
            
        });
  
}catch(error){
    res.status(400).send(error.toString());
}
});

    

module.exports = router;