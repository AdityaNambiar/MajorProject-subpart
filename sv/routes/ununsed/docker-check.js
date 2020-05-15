const path = require('path');
const express = require('express');
const router = express.Router();
const fs = require('fs');
const { exec } = require('child_process');
const Docker = require('dockerode');
const dockerapi = new Docker();

      
        
router.post('/docker-check', async (req, res) => {

    try {
        
      res.status(200).send(dockerimage);
    } catch (err) {
      console.log(err);
      res.status(400).send(`(deploy) main err ${err.name} :- ${err.message}`);
    }
})
function searchImage(projName) {
    return new Promise( (resolve, reject) => {
        try {
            dockerapi.listImages({ 
                filter: `localhost:7009/${projName}`
            })
            .then( (resp) => { 
              console.log(resp) 
            })
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