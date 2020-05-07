/**
 * The only purpose of this file is to read the hashes and pass data buffer 
 * in the response object.
 * 
 * majorHash = directory hash
 * fileHash = one of the hashes of a file
 */
const ipfsClient = require('ipfs-http-client');
const ipfs = ipfsClient('0.0.0.0', '5001');
const express = require('express');
const router = express.Router();
router.post('/downloadDocument', (req, res) => {

    try {
        let fileHash = req.body.fileHash; // Expects a single file's IPFS hash
        ipfs.cat(fileHash, (err, file_cat) => {
            if (err) {
                console.log(err);
                throw new Error(`(downloadDocument) ipfs.cat API err ${err.name} :- ${err.message}`);    
            }
            res.send(file_cat);
        });
    } catch (err) {
        console.log(err);
        res.status(400).send(`(downloadDocument) ipfs-cat err ${err.name} :- ${err.message}`);
    }
});



module.exports = router;