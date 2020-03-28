/**
 * This file forms the Evidence object that IPFS JS API expects and 
 * uploads it to the IPFS network.
 */
const ipfsClient = require('ipfs-http-client');
const ipfs = ipfsClient('labsys-ipfs', '5001');
const fs = require('fs');
const express = require('express');
const router = express.Router();
const upload = require('express-fileupload');
const path = require('path');
router.use(upload()); // Basically allows us to access 'files' array in the "req" object in below function: 
router.post('/',async (req,res)=>{
    /* 
        req = Request object. It is an object that contains information
                about the object that initiated the request to this file.
        res = Response object. It is an object that can be formed with 
                some information to send a response to be passed out from this file.
    */
try{

    console.log("Create Evidence [REQ_OBJ]:", req);
    let files = []
    let keys  = Object.keys(req.files).length; // Here: 'req.files' requires middleware...
        //...router.use(upload()) to access express-fileupload middleware (a set of actions)
    let fileObj = req.files;
    for(let i=0;i<keys;i++){
        const filename = fileObj[i].name
        let fileobj = {
            path: `EvidencesDir/${filename}`,
            content:fileObj[i].data
        }
        files.push(fileobj);
    }
   
   let evidenceKey = req.body.evidenceKey;
    const uObj = {
        unique_id:req.body.cardName // Change this Unique ID to the one from Participant Card 
    }
   await ipfs.add(Array.from(files),hashResult);
    let hash = null;
    function hashResult(err,results){

            if (err) console.log("ERROR: ",err);
            // console.log("RESULT: ",results);
    
            hash = results[results.length-1].hash; // Access hash of only the directory
            ipfs.pin.add(hash, (err, req) => { 
                if(err) console.log("PIN ERR: ", err);
                // console.log("PINNED: ", req);
            });
            let dirHashToStore = {}
            let dir = path.join(__dirname,`../${uObj.unique_id}`)
            let evidenceDir = `${dir}/${evidenceKey}`
            if (!fs.existsSync(dir)){
                fs.mkdirSync(dir);
            }
            if(!fs.existsSync(evidenceDir)){
                fs.mkdirSync(evidenceDir);
            }
            if (!fs.existsSync(evidenceDir+'/dirHashData.json')){
                let FileObj = {
                    dirHash:[]
                }
                fs.writeFile(evidenceDir+'/dirHashData.json',JSON.stringify(FileObj), (err) => {
                    if (err) console.log(err);
                        console.log(`File created in ${uObj.unique_id} file.`);
                    }
                )
            }
            fs.readFile(evidenceDir+'/dirHashData.json', 'utf-8',(err,data) => {
                if (err) console.log("File Read: ",err)
                let dirHashToStore = JSON.parse(data)
                if (!dirHashToStore.dirHash.includes(hash)) dirHashToStore.dirHash.push(hash)
                
                if (!fs.existsSync(evidenceDir)){
                    fs.mkdirSync(evidenceDir);
                }
                    
                console.log(dirHashToStore);
                //Store the directory hash at server.
                fs.writeFile(evidenceDir+"/dirHashData.json", JSON.stringify(dirHashToStore), (err) => {
                if (err) console.log(err);
                    console.log(`Wrote Directory Hash in ${uObj.unique_id} file.`);
                    return res.status(200).send(hash)    
                })   
            })
            
       
    }
    
}catch(error){
    console.log(error);
    res.status(400).send(error)
}

})
module.exports = router