/**
 * This file forms the Evidence object that IPFS JS API expects and 
 * uploads it to the IPFS network.
 */
const ipfsClient = require('ipfs-http-client');
const ipfs = ipfsClient('0.0.0.0', '5001');
const fs = require('fs');
const express = require('express');
const router = express.Router();
const upload = require('express-fileupload');
const path = require('path');
router.use(upload()); // Basically allows us to access 'files' array in the "req" object in below function: 
router.post('/createDocument', async (req, res) => {
    try {
        let files = []
        let fileObjArr = req.files.ipfsFiles;
        for (let i = 0; i < fileObjArr.length; i++) {
            const filename = fileObjArr[i].name
            let obj = {
                path: `DocumentsDir/${filename}`,
                content: fileObjArr[i].data
            }
            files.push(obj);
        }
        await ipfs.add(Array.from(files), (err, results) => {

            if (err) {
                console.log(err);
                throw new Error(`(createDocument) ipfs.add err ${err.name} :- ${err.message} `)
            }

            hash = results[results.length - 1].hash; // Access hash of only the directory
            ipfs.pin.add(hash, (err, req) => {
                if (err){
                    console.log(err);
                    throw new Error(`(createDocument) ipfs.pin.add err ${err.name} :- ${err.message} `)
                }
                res.status(200).send(hash)
            });
        })
    } catch (err) {
        console.log(err);
        res.status(400).send(`(createDocument) res err ${err.name} :- ${err.message} `)
    }

})
module.exports = router