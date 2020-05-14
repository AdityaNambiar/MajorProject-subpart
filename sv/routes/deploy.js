const path = require('path');
const express = require('express');
const router = express.Router();
const fs = require('fs');
const { exec } = require('child_process');
const Docker = require('dockerode');
const dockerapi = new Docker();

router.post('/deploy', async (req, res) => {

    try {
        let projName = req.body.projName;
        let workdirpath = req.body.workdirpath;

        let stream = await deploy(workdirpath, projName);
        let isCompleted = await hasContainerRan(stream);
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