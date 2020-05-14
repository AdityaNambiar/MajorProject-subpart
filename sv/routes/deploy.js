const path = require('path');
const express = require('express');
const router = express.Router();
const fs = require('fs');
const { exec } = require('child_process');
const Docker = require('dockerode');
const IP = require('ip').address(); // Get machine IP.
const dockerapi = new Docker();
router.post('/deploy', async (req, res) => {

    try {
        let projName = req.body.projName;
        let workdirpath = req.body.workdirpath;

        let op1 = await pullImage(workdirpath, projName);
        let isCompleted = await createContainer(stream);
        if (isCompleted){
            res.status(200).json({data: projName});
        } else {
            res.status(400).json({data:"Docker Build Failed - Check logs!"});                
        }
        console.log(resp);
    } catch (err) {
        console.log(err);
        res.status(400).json({data:`(deploy) main err ${err.name} :- ${err.message}`});
    }
})
function searchImage(projName) {
    return new Promise( (resolve, reject) => {
        try {
            dockerapi.push({
              context: workdirpath,
              src: ['Dockerfile']
            }, {t: projName}, function (err, response) {
              if (err) {
                console.log(err);
                reject(new Error(`(deploy)  err ${err.name} :- ${err.message}`));
              }
              resolve(response);
            });
        } catch(err) {
            console.log(err);
            reject(new Error(`showLogs err: ${err}`));
        }
    })
}

function pullImage(projName) {
    return new Promise( (resolve, reject) => {
        try {
            let tag = await getTagName(projName);
            docker.pull(`${IP}:7009/${projName}:${tag}`, function (err, stream) {
              if (err) {
                console.log(err);
                reject(new Error(`docker-pull err ${err.name} :- ${err.message}`))
              }
              stream.on('data', (data) => {
                resolve(data);
              })
            });
        } catch(err) {
            console.log(err);
            reject(new Error(`pullImage err: ${err}`));
        }
    })
}

function getTagName(projName) {
    return new Promise( (resolve, reject) => {
        try {
            exec(`curl http://${IP}:7009/v2/${projName}/tags/list`, {
                cwd: process.cwd(),
                shell: true
            }, (err, stdout, stderr) => {
                if (err) {
                    console.log(err);
                    reject(new Error(`curl err ${err.name} :- ${err.message}`))
                }
                if (stderr) {
                    console.log(stderr);
                    reject(new Error(`curl err ${stderr}`))
                }
                if (stdout.includes("404")){ // Because curl thinks of 404 as stdout from private registry server.
                    console.log(stderr);
                    reject(new Error(`curl err ${stdout}`))    
                }
                let img_json = JSON.parse(stdout); 
                let len = img_json.tags.length; // Get length of image tags array
                let latest_tag = img_json.tags[len -1];
                console.log(latest_tag);
                resolve(latest_tag);
            })
        } catch(err) {
            console.log(err);
            reject(new Error(`pullImage err: ${err}`));
        }
    })
}
function createContainer(workdirpath, projName){
    return new Promise( (resolve, reject) => {
        try {
            dockerapi.push({
              context: workdirpath,
              src: ['Dockerfile']
            }, {t: projName}, function (err, response) {
              if (err) {
                console.log(err);
                reject(new Error(`(deploy)  err ${err.name} :- ${err.message}`));
              }
              resolve(response);
            });
        } catch(err) {
            console.log(err);
            reject(new Error(`showLogs err: ${err}`));
        }
    })
}


module.exports = router