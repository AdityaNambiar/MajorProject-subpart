const ipfsClient = require('ipfs-http-client');
const ipfs = ipfsClient('localhost', '5001',{protocol: 'http'});
const express = require('express');
const path = require('path');
const router = express.Router();
const fs = require('fs');

router.post('/',(req,res)=>{

    try{
        var allFiles ={

        };
        var filesBuffer = [];
        let obtainedDirHashList = "";
        let unique_id = req.body.id
        let dir = path.join(__dirname,`../${unique_id}/`)
        var filesBufferArr = []
        fs.readFile(dir+"/dirHashData.json", 'utf-8', (err,data) => {
            if(err) console.log("Readfile: ",err)
            obtainedDirHashList = JSON.parse(data).dirHash
            obtainedDirHashList.forEach( (obtainedDirHash,i) => {
                // Reading the directory hash of the user
                ipfs.ls('/ipfs/'+obtainedDirHash, (err, files) => { 
                    if (err) console.log("ERROR [ IPFS LS ]\n", err)
                   
                    //console.log("NODE DATA [LS]: ",files);
                    loadFiles(files,obtainedDirHash);
                    // if(obtainedDirHashList.length==i+1){
                    //     res.send(allFiles);
                    // }
                    
                })
            })
             
        })

        function loadFiles(files, obtainedDirHash){
            let len = files.length;
            files.forEach((file,i) => {     
                ipfs.cat('/ipfs/'+ file.hash, (err, file_cat) => {
                    if (err) console.log("ERROR [ IPFS CAT ]\n", err)
                    //console.log('FILES [CAT]: ',file_cat);
                   filesBuffer.push({"name":file.name,"buffer":file_cat});
                   console.log(`len: ${len} and i: ${i} and value: ${len==i+1}`)
                    if(len==(i+1)){
                        console.log(`len: ${len} and i: ${i} and value: ${len==i+1}`)
                        allFiles[obtainedDirHash] = filesBuffer;
                        
                        //console.log(allFiles)
                    }
                    
                })
            })
        }
        
    }
    catch(e) {
        console.log();
    } 

})

module.exports = router