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
        let isCompleted = await isImageBuilt(stream);
        if (isCompleted){
            res.status(200).json({data: projName});
        } else {
            res.status(400).json({data:"Docker Build Failed - Check logs!"});                
        }
        console.log(resp);
    } catch (err) {
        console.log(err);
        res.status(400).send(`(deploy) main err ${err.name} :- ${err.message}`);
    }
})
function buildImage(workdirpath, projName){
    return new Promise( (resolve, reject) => {
        try {
            dockerapi.buildImage({
              context: workdirpath,
              src: ['Dockerfile']
            }, {t: projName}, function (err, response) {
              if (err) {
                console.log(err);
                reject(new Error(`(buildImage) docker.buildImage err ${err.name} :- ${err.message}`));
              }
              resolve(response);
            });
        } catch(err) {
            console.log(err);
            reject(new Error(`(buildImage) err ${err.name} :- ${err.message}`));
        }
    })
}
function pushToPrivateDockerReg(workdirpath, projName){
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

function isImageBuilt(stream){
    return new Promise((resolve, reject) => {
            try {
                dockerapi.modem.followProgress(stream, (err, res) => {
                    if (err) {
                        console.log(res)
                        reject(new Error(`(isImageBuilt) followProgress err ${err.name} :- ${err.message}`));
                    }
                    console.log(res);
                    resolve(res);
                })
            } catch(err) {
                console.log(err);
                reject(new Error(`(isImageBuilt)  err ${err.name} :- ${err.message}`))
            }
    });
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