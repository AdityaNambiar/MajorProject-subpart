const path = require('path');
const express = require('express');
const router = express.Router();
const fs = require('fs');
const { exec } = require('child_process');
const Docker = require('dockerode');
const IP = require('ip').address(); // Get machine IP.
const getPort = require('get-port'); // To fetch random port number.
const dockerapi = new Docker();
router.post('/deploy', async (req, res) => {

    try {
        let projName = req.body.projName;
        let workdirpath = req.body.workdirpath;

        //let op1 = await pullImage(workdirpath, projName); 
        let url = await createContainer(projName);
            res.status(200).json({data: projName, url: url});
        //} else {
           // res.status(400).json({data:"Docker Build Failed - Check logs!"});                
        //}
    } catch (err) {
        console.log(err);
        res.status(400).json({data:`(deploy) main err ${err.name} :- ${err.message}`});
    }
})
function pullImage(projName) {
    /**
        When pulling images:
        - Remove the existing any projName image on local system (so that you can pull the projName image and only it stays - the one with the private registry IP)
        - Remove any existing projName containers. (Containers with the same projName cannot exist so it gives a "Conflict. The container name "/reactapp" is already in use" error anyway)
            -- I think it's better to clean up and then pull and then run container.
    */
    return new Promise( async (resolve, reject) => {
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
                    //reject(new Error(`curl err ${stderr}`))
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
function createContainer(projName){
    return new Promise( async (resolve, reject) => {
        try {
            let tag = await getTagName(projName);
            let container = await dockerapi.createContainer({
              Image: `${IP}:7009/${projName}:${tag}`,
              name: `${projName}`,
              PublishAllPorts: true
            }) 
            let containerStarted = await container.start();
            var port = "";
            await container.inspect((err, data) => {
                if (err) throw new Error(err);
                console.log(data.NetworkSettings.Ports['8080/tcp'][0]);
                port = data.NetworkSettings.Ports['8080/tcp'][0].HostPort;
                resolve(`http://${IP}:${port}`);
            })
        } catch(err) {
            console.log(err);
            reject(new Error(`showLogs err: ${err}`));
        }
    })
}


module.exports = router