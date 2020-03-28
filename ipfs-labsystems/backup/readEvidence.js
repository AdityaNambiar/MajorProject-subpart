const ipfsClient = require('ipfs-http-client');
const ipfs = ipfsClient('localhost', '5001',{protocol: 'http'});
const express = require('express');
const path = require('path');
const router = express.Router();
const fs = require('fs');
//"QmNScMXuajdqjAfV1m64uLMgWwct3nusxQtKTczVU8pdwU"

// "Qmd6src3QTJ7tFGxVySjHfFf574LfCurspERSNAwtZ7qus"
router.post('/',async (req,res)=>{

    try{
        var fileLen = 0;
        var allFiles =[];
        var filesBuffer = [];
        var obtainedDirHashList = "";
        function timeoutPromise(){

            return new Promise(function (resolve) {
               
            let unique_id = req.body.id;
            let dir = path.join(__dirname,`../${unique_id}/`);
            fs.readFile(dir+"/dirHashData.json", 'utf-8', (err,data) => {
                if(err) console.log("Readfile: ",err)
                obtainedDirHashList = JSON.parse(data).dirHash
                obtainedDirHashList.forEach( (obtainedDirHash,i) => {
                 // Reading the directory hash of the user
                 ipfs.ls('/ipfs/'+obtainedDirHash,bufferCallback);
                })      
            })
            // setTimeout(()=>{
            //     resolve(filesBuffer);
            // },1000)
            
              })

        }
           
         function bufferCallback(err, files){ 
            if (err) console.log("ERROR [ IPFS LS ]\n", err)
            //console.log("NODE DATA [LS]: ",files);
            files.forEach((file,i) => {     
                ipfs.cat('/ipfs/'+ file.hash, (err, file_cat) => {
                    if (err) console.log("ERROR [ IPFS CAT ]\n", err)
                    //console.log('FILES [CAT]: ',file_cat);
                   filesBuffer.push({"name":file.name,"buffer":file_cat}); 
                
                });
                
            })
            
        }

       var myVar =  setInterval(check,1000);

       function check(){
        if(filesBuffer.length!==0){
            clearInterval(myVar);
            // console.log(filesBuffer.length)
            
            // res.status(200).send({"fileLength":filesBuffer.length})
            // res.status(200).send(JSON.parse(filesBuffer))
            console.log(filesBuffer);
            console.log(filesBuffer.length)

        }
    }

        const bf =  await timeoutPromise();
        // console.log(bf);
        
    }
    catch(e) {
        console.log();
    } 

})

module.exports = router