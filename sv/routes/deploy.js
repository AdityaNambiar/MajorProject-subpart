const path = require('path');
const express = require('express');
const router = express.Router();
const Docker = require('dockerode');
const IP = require('ip').address(); // Get machine IP.
//const http = require('http');
const dockerapi = new Docker();
const registryPort = 7009; // Ideally you can set this as process.env or something like this to take in the registry port no. from environment variables.


// (async () => {
//     const image = await dockerapi.listImages({
//                 filter: `${IP}:${registryPort}/react`
//             });
//     console.log(image);
// });

// Utility imports:

const cleanUp = require('../utilities/cleanUp');

router.post('/deploy', async (req, res) => {

    try {
        let projName = req.body.projName;
        let branchName = req.body.branchName;
        let tagName = req.body.tagName;
        console.log(tagName);
        await cleanUp(projName);
        await pruneImages();
        await pullImage(projName, tagName); 
        let urls = await createContainer(projName, tagName, branchName);
        res.status(200).json({projName: projName, urls: urls});
    } catch (err) {
        console.log(err);
        await pruneImages()
        await pruneContainers()
        res.status(400).json({err:`(deploy) main err ${err.name} :- ${err.message}`});
    }
})
function pruneImages(){
    return new Promise( (resolve, reject) => {
        try {
            dockerapi.pruneImages({ 
                filters: { // this is what they mean by - map[string][]string <- where first 'string' is key of JSON obj and second 'string' is value of string array of JSON obj
                    "dangling":["true"]
                }
            })
            return resolve(true)
        } catch(err) {
            console.log(err);
            return reject(new Error(`Unable to prune images: `+err));
        }
    })
}

function pruneContainers(){
    return new Promise( (resolve, reject) => {
        try {
            dockerapi.pruneContainers({ 
                filters: { // this is what they mean by - map[string][]string <- where first 'string' is key of JSON obj and second 'string' is value of string array of JSON obj
                    "label!":["registry"] // Remove any container without the name "registry"
                }
            })
            return resolve(true)
        } catch(err) {
            console.log(err);
            return reject(new Error(`Unable to prune images: `+err));
        }
    })
}
function pullImage(projName, tagName) {
    /**
        When pulling images:
        - Remove the existing any projName image on local system (so that you can pull the projName image and only it stays - the one with the private registry IP)
        - Remove any existing projName containers. (Containers with the same projName cannot exist so it gives a "Conflict. The container name "/reactapp" is already in use" error anyway)
            -- I think it's better to clean up and then pull and then run container.
    */
    console.log("Pulling image...");
    return new Promise( async (resolve, reject) => {
        try {
            let tagname = tagName;
            dockerapi.pull(`${IP}:${registryPort}/${projName}:${tagname}`, (err, stream) => {
              if (err) {
                console.log(err);
                return reject(new Error(`docker-pull err ${err.name} :- ${err.message}`))
              } else {
                  stream.on('data', (data) => 
                  {
                    //console.log("pullImage: \n",String(data));
                  })
                  stream.on('error', (error) => {
                    return console.log("pullImage stream error: \n",error);
                  })
                  return resolve(data);
              }
            });
        } catch(err) {
            console.log(err);
            return reject(new Error(`pullImage err: ${err}`));
        }
    })
}

function createContainer(projName, tagName){
    console.log("Going to run container...");
    return new Promise( async (resolve, reject) => {
        try {
            let tag = tagName;
            let container = await dockerapi.createContainer({
              Image: `${IP}:${registryPort}/${projName}:${tag}`,
              name: `${projName}`,
              PublishAllPorts: true
            }) 
            let containerStarted = await container.start();
            var ports = [], urls = [], containerPort = "";
            await container.inspect((err, data) => {
                if (err) throw new Error(err);
                var portBindings = data.NetworkSettings.Ports;
                //console.log("pbings: \n",portBindings);
                for (let pb in portBindings){
                    containerPort = pb;
                    ports.push(portBindings[pb][0].HostPort);
                }
                console.log("ports: \n", ports);
                for (let p in ports){
                    urls.push(`http://${IP}:${ports[p]} (${containerPort})`);
                }
                console.log("urls: \n", urls);
                return resolve(urls);
            })
        } catch(err) {
            console.log(err);
            return reject(new Error(`createContainer err: ${err}`));
        }
    })
}

module.exports = router