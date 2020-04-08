/**
 * readFile and send its Buffer.
 * 
 * 1. Get file name
 * 2. fs.readFile(...path...filename)
 * 3. return the buffer
 */

const getFromIPFS = require('../utilities/getFromIPFS');
const cloneBare = require('../utilities/cloneBare');

const path = require('path');
const fs = require('fs');

const express = require('express');
const router = express.Router();

router.post('/readForBuffer', async (req, res) => {
    const filename = req.body.filename;
    const projName = 'app' || req.body.projName;
    let buffer;
    const majorHash = "QmX4nZGMdwhDCz4NvLrcaVUWJAFL4YzoRS98unY9xx8cLs"; // hard-coded
        if (!fs.existsSync(path.resolve(__dirname,'..','projects',projName+'.git'))){
            console.log("does not exist");
            await getFromIPFS(majorHash, projName)
            .then( async () => {
                console.log("going for main action ...");
                buffer = await main(projName, filename);
            })
            .then( () => {
                console.log('buffer: ', String(buffer));
                res.status(200).send({projName: projName, buffer: buffer, filename: filename});
            })
            .catch( (e) => {    
                res.status(400).send(e);
            })
        }
})

async function main(projName, filename) {
    return new Promise( async (resolve, reject) =>{
            console.log(path.resolve('projects',projName, filename));
            fs.readFile(path.resolve('projects',projName, filename),(err, data) => {
                if (err) {
                    console.log('fs readfile err: ', err);
                    reject(err);
                }
                resolve(data);
            })
    })
}
module.exports = router;