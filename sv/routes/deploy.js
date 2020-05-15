const path = require('path');
const express = require('express');
const router = express.Router();
const fs = require('fs');
const { exec } = require('child_process');
const Docker = require('dockerode');
const IP = require('ip').address(); // Get machine IP.
const http = require('http');
const dockerapi = new Docker();
const registryPort = 7009; // Ideally you can set this as process.env or something like this to take in the registry port no. from environment variables.

router.post('/deploy', async (req, res) => {

    try {
        let projName = req.body.projName;
        let workdirpath = req.body.workdirpath;

        await cleanUp(projName);
        await pullImage(workdirpath, projName); 
        let url = await createContainer(projName);
        res.status(200).json({data: projName, url: url});
    } catch (err) {
        console.log(err);
        res.status(400).json({data:`(deploy) main err ${err.name} :- ${err.message}`});
    }
})

function cleanUp(projName) {
    /**
        To remove all same name containers:
        - docker rm $(docker ps -a | grep reactapp | awk '{ print $1 }')
        To remove all same name images:
        - docker rmi $(docker ps -a | grep reactapp | awk '{ print $3 }')

        But these are NOT RELIABLE. They will also match substrings like for project name with 'react',
        it will also match "reactapp". That is, it will display the super string as well.  
    */
    return new Promise( async (resolve, reject) => {
        try {
            await removeContainer(projName);
            await removeImages(projName);
            resolve(true); 
        } catch(err) {
            console.log(err);
            reject(new Error(`(cleanUp) err ${err.name} :- ${err.message}`))
        }
    })
}

function removeImages(projName){
    return new Promise( async (resolve, reject) => {
        try{ 
            const nametag = await getTagName(projName);
            const image = await dockerapi.getImage(projName+nametag); // Need to provide tagname here incase the default "latest" is not present, it would give an error if that would be the case.
            let repoTags = await image.inspect().RepoTags; // Gives an array of tags already present of the same image name.
            let allRepoTags = repoTags.filter(e => e.includes("192.168.1.101:7009/")) // Only consider the registry tagged images.
            let most_recent_img = allRepoTags[allRepoTags.length - 1] // which among them is the latest
            let oldRepoTags = allRepoTags.filter(e => e !== most_recent_img)

            for (let i = 0; i < oldRepoTags.length; i++) {
                const image = await dockerapi.getImage(oldRepoTags[i]);
                await image.remove(); 
            }
        } catch(err) {
            console.log(err);
            reject(new Error('(removeImages) err: '+err));
        }
    })
}

function removeContainer(projName) {
    return new Promise( async (resolve,reject) => {
        try {   
            const container = await dockerapi.getContainer(projName);
            let resp = await container.remove({ v: true }); // v = remove 'volume' of container as well. 
            resolve(resp);
        } catch(err) {
            console.log(err);
            reject(new Error(`(removeContainer) err ${err.name} :- ${err.message}`))
        }
    })
}
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
            dockerapi.pull(`${IP}:${registryPort}/${projName}:${tag}`, function (err, stream) {
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
    return new Promise( async (resolve, reject) => {
        try {
            const image = await dockerapi.getImage(projName)
            let repoTags = await image.inspect().RepoTags; // Gives an array of tags already present of the same image name.
            let newRepoTags = repoTags.filter(e => e.includes(`${IP}:${registryPort}/`))
            let most_recent_tag = newrepotags[newrepotags.length - 1].split(`${projName}:`)[1] // Eg: "192.168.1.101:7009/reactapp:v4"            
            resolve(most_recent_tag);
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
              Image: `${IP}:${registryPort}/${projName}:${tag}`,
              name: `${projName}`,
              PublishAllPorts: true
            }) 
            let containerStarted = await container.start();
            var ports = [], urls = [], containerPort = "";
            await container.inspect((err, data) => {
                if (err) throw new Error(err);
                var portBindings = data.HostConfig.PortBindings;
                for (let pb in portBindings){
                    containerPort = pb;
                    ports.push(portBindings[pb][0].HostPort);
                }
                for (let p in ports){
                    urls.push(`http://${IP}:${p} (${containerPort})`);
                }
                resolve(urls);
            })
        } catch(err) {
            console.log(err);
            reject(new Error(`showLogs err: ${err}`));
        }
    })
}

/* BACKUP FOR REFERENCE (whenever we want to fetch digest of an image -
    As said in the API documentation, you need to pass name and digest with HTTP Method "DELETE" to remove the 
    image from registry but this gives me UNSUPPORTED error.. probably it requires RepoDigest and not .Id):
*/
/*function getImageDigest(projName, tagId){
    return new Promise( (resolve, reject) => {
        try{ 
            const options = {
                method: "GET",
            }

            const req = http.request(`http://${IP}:${registryPort}/v2/${projName}/manifests/${tagId}`, options, (res) => {
                res.on('data', (chunk) => {
                    resolve(JSON.parse(String(chunk)).config.digest); // Return the image digest.
                })
                res.on('error', (error) => {
                    reject(new Error("http resp err: \n",error));
                })
            })
            req.setHeader("Accept","application/vnd.docker.distribution.manifest.v2+json")
            req.on('error', (e) => {
              reject( new Error(`problem with request: ${e.message}`));
            });

            req.end();

        } catch(err) {
            console.log(err);
            reject(new Error('(getImageDigest) err: '+err));
        }
    })
}*/
module.exports = router