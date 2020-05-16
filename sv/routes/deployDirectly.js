const path = require('path');
const express = require('express');
const router = express.Router();
const fs = require('fs');
const { exec } = require('child_process');
const Docker = require('dockerode');
const dockerapi = new Docker();
const tar = require('tar-fs');

const IP = require('ip').address(); // Get machine IP.
const registryPort = 7009; // Ideally you can set this as process.env or something like this to take in the registry port no. from environment variables.

 // ( async () => {
 //     const image = dockerapi.pruneImages({ 
 //                filters: {
 //                    "dangling":["true"]
 //                }
 //            })
 //     console.log(await image);
 // })();

// Utility imports:

const cleanUp = require('../utilities/cleanUp');
const cloneRepository = require('../utilities/cloneRepository');

router.post('/deployDirectly', async (req, res) => {

    try {
        let projName = req.body.projName;
        let branchName = req.body.branchName;
        let tagName = req.body.tagName;
        let timestamp = Date.now();
        let workdirpath = await cloneRepository(projName, branchName, timestamp);
        let imageName = `${IP}:${registryPort}/${projName}-${branchName}:${tagName}`
        await buildImage(workdirpath,projName,imageName);
        await pushImage(imageName);
        await cleanUp(imageName, projName, branchName);
        await pruneImages();
        await pruneContainers();
        await pullImage(imageName);
        let urls = await createContainer(projName, branchName, imageName) 

        res.status(200).json({projName: projName, urls: urls});
    } catch (err) {
        console.log(err);
        await pruneImages();
        res.status(400).json({err: `Error occured during direct deployment : \n${err.name} :- ${err.message}`});
    }
})
function buildImage(workdirpath, projName, imageName){
    console.log("Building image ...")
    return new Promise( async (resolve, reject) => {
        var tarStream = tar.pack(workdirpath);
        try {
            await dockerapi.buildImage(tarStream, {nocache: true, t: imageName}, function (err, stream) {
              if (err) {
                console.log(err);
                return reject(new Error(`(buildImage) docker.buildImage err ${err.name} :- ${err.message}`));
              }
                dockerapi.modem.followProgress(stream, onFinished, onProgress);
                // stream is the object which just prints "IncomingMessage..."
                function onProgress(err, output) {
                    if (err) {
                        //console.log(err);
                    } else {
                        //console.log(output); 
                        //^ This is the stream output.
                    }
                }
                function onFinished(err, output) {
                    if (err){ // docker image build was unsuccessful.
                        //console.log(err);
                        return reject(new Error(`followProgress - buildImage err: ${err}`))
                    } else {
                        // fs.writeFileSync(projName+'-dockerlogs.txt', JSON.stringify(output)
                        //     , { flags: 'w' });
                        return resolve(true);
                    }
                }
            });
        } catch(err) {
            console.log(err);
            return reject(new Error(`(buildImage) err ${err.name} :- ${err.message}`));
        }
    })
}

function pushImage(imageName){
    console.log("Pushing image ...")
    return new Promise( async (resolve, reject) => {
        try {
            await exec(`docker push ${imageName}`, {
                cwd: process.cwd(),
                shell: true
            }, (err,stdout,stderr) => {
                if (err){
                    console.log(err);
                    return reject(new Error(`pushImage cli err ${err}`));
                }
                if (stderr) {
                    console.log(stderr);
                    return reject(new Error(`pushImage cli stderr ${stderr}`))
                }
                return resolve(stdout);
            });
        } catch(err) {
            console.log(err);
            return reject(new Error(`pushImage err: ${err}`));
        }
    })
}
function pruneImages(){
    console.log("Pruning dangling images ...")
    return new Promise( async (resolve, reject) => {
        try {
            await dockerapi.pruneImages({ 
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
    console.log("Pruning containers except 'registry' ...")
    return new Promise( async (resolve, reject) => {
        try {
            await dockerapi.pruneContainers({ 
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
function pullImage(imageName) {
    /**
        When pulling images:
        - Remove the existing any projName image on local system (so that you can pull the projName image and only it stays - the one with the private registry IP)
        - Remove any existing projName containers. (Containers with the same projName cannot exist so it gives a "Conflict. The container name "/reactapp" is already in use" error anyway)
            -- I think it's better to clean up and then pull and then run container.
    */
    console.log("Pulling image...");
    return new Promise( async (resolve, reject) => {
        try {
            await dockerapi.pull(imageName, (err, stream) => {
              if (err) {
                console.log(err);
                return reject(new Error(`docker-pull err ${err.name} :- ${err.message}`))
              } else {
                  stream.on('data', (data) => 
                  {
                    // This is stream (access the strings via data.stream) logs
                    //console.log("pullImage: \n",String(data));
                  })
                  stream.on('end',(data)=> {
                    //console.log(data); // undefined.
                    return resolve(true);
                  })
                  stream.on('error', (error) => {
                    return console.log("pullImage stream error: \n",error);
                  })
              }
            });
        } catch(err) {
            console.log(err);
            return reject(new Error(`pullImage err: ${err}`));
        }
    })
}

function createContainer(projName, branchName, imageName){
    console.log("Going to run container...");
    return new Promise( async (resolve, reject) => {
        try {
            let container = await dockerapi.createContainer({
              Image: `${IP}:${registryPort}/${projName}-${branchName}:0.2`,
              name: `${projName}-${branchName}`,
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