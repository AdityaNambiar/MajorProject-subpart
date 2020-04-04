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
    try {
        if (!fs.existsSync(__dirname,'..','projects',projName+'.git')){
            await getFromIPFS(majorHash, projName)
            .then( async () => {
                await cloneBare(projName);
            })
            .then( async () => {
                buffer = await main(projName, filename);
            })
            .catch( (e) => {
                console.log('err while fetching / cloning repo: ', e);
                res.status(400).send(e);
            })
        }
        console.log('buffer: ', String(buffer));
        res.status(200).send({projName: projName, buffer: buffer, filename: filename});
    } catch(e){
        console.log('readFile main err: ', e);
        res.status(400).send(e);
    }
})

async function main(projName, filename) {
    return new Promise( async (resolve, reject) =>{
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