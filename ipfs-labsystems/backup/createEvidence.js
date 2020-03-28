const ipfsClient = require('ipfs-http-client');
const ipfs = ipfsClient('localhost', '5001',{protocol: 'http'});
const fs = require('fs');
const express = require('express');
const router = express.Router();
const upload = require('express-fileupload');
const path = require('path');
router.use(upload());
router.post('/',async (req,res)=>{
try{


    let filesArr = req.files.ipfsFiles;
    let files = []
    Array.from(filesArr).forEach(file => {
        const filename = file.name
        let fileobj = {
            path: `EvidencesDir/${filename}`,
            content:file.data
        }
        files.push(fileobj);
    });
    
    
    const uObj = {
        unique_id:"evidence1001" // Change this Unique ID to the one from Participant Card 
    }
   
   await ipfs.add(Array.from(files),hashResult);

    function hashResult(err,results){

            if (err) { console.log("ERROR: ",err); return;}
            // console.log("RESULT: ",results);
    
            hash = results[results.length-1].hash; // Access hash of only the directory
            ipfs.pin.add(hash, (err, req) => { 
                if(err) console.log("PIN ERR: ", err);
                // console.log("PINNED: ", req);
            });
            let dirHashToStore = {
                dirHash: hash
            };
            // console.log(dirHashToStore);
            let dir = path.join(__dirname,`../${uObj.unique_id}`)
            if (!fs.existsSync(dir)){
                fs.mkdirSync(dir);
            }
            //Store the directory hash at server.
            fs.writeFile(dir+"/dirHashData.json", JSON.stringify(dirHashToStore), (err) => {
            if (err) console.log(err);
                console.log(`Wrote Directory Hash in ${uObj.unique_id} file.`);
            })   
        res.status(200).send("File uploaded to ipfs succesfully...")    
    }
    
}catch(error){
    console.log(error);
    res.status(400).send(error)
}

})
module.exports = router