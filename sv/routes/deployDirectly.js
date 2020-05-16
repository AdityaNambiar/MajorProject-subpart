const path = require('path');
const express = require('express');
const router = express.Router();
const fs = require('fs');
const { exec } = require('child_process');
const Docker = require('dockerode');
const dockerapi = new Docker();

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
router.post('/deployDirectly', async (req, res) => {

    try {
        let projName = req.body.projName;
        let branchName = req.body.branchName;

        let workdirpath = await cloneRepo(projName, branchName);
        await buildImage(workdirpath, projName);
        await pushImage(projName);
        await cleanUp(projName);
        await pullImage(projName);
        let urls = await createContainer(projName); 

        res.status(200).json({projName: projName, urls: urls});
    } catch (err) {
        console.log(err);
        await pruneImages();
        res.status(400).json({err: `Error occured during direct deployment : \n${err.name} :- ${err.message}`});
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
            resolve(true)
        } catch(err) {
            console.log(err);
            reject(new Error(`Unable to prune images: `+err));
        }
    })
}
function mkProjSilo() {
    return new Promise( (resolve, reject) =>{
        try {
            let projects_silo_path = path.resolve(__dirname,'..','projects_silo');
            if(!fs.existsSync(projects_silo_path)){
                fs.mkdir(projects_silo_path, { recursive: true }, (err) => {
                    if (err) reject(new Error(`mkdir proj silo err: ${err}`));
                    resolve(projects_silo_path);
                })
            }
            resolve(projects_silo_path);
        } catch (err) {
            reject(new Error('mkProjSilo err: '+err));
        }
    })
}
function cloneRepo(projName, branchName) {
    return new Promise( async (resolve, reject) => {
        try {
            let projects_silo_path = await mkProjSilo();
            let url = `http://localhost:7005/projects/bare/${projName}.git`
            let projPath = path.join(projects_silo_path, projName);
            if (fs.existsSync(projPath)){
                fs.rmdir(projPath, {recursive:true}, (err) => {
                    if (err) {
                        console.log(err);
                        reject(new Error(`Could not remove old workspace: ${err}`))
                    }
                    exec(`git clone ${url} ${projName}-${branchName}`, {
                        cwd: projects_silo_path,
                        shell: true
                    }, (err, stdout, stderr) => {
                        if (err) {
                            console.log(err);
                            reject(new Error(`(cloneRepo) git-clone cli err ${err.name} :- ${err.message}`));
                        }
                        if (stderr) {
                            // The cloning output is apparently put inside "stderr"... so not picking that.
                            //console.log(stderr);
                            //reject(new Error(`(cloneRepo) git-clone cli stderr:\n ${stderr}`));
                        }
                        resolve(path.join(projects_silo_path, projName));
                    })
                })
            } else {
                exec(`git clone ${url} ${projName}-${branchName}`, {
                        cwd: projects_silo_path,
                        shell: true
                    }, (err, stdout, stderr) => {
                        if (err) {
                            console.log(err);
                            reject(new Error(`(cloneRepo) git-clone cli err ${err.name} :- ${err.message}`));
                        }
                        if (stderr) {
                            // The cloning output is apparently put inside "stderr"... so not picking that.
                            //console.log(stderr);
                            //reject(new Error(`(cloneRepo) git-clone cli stderr:\n ${stderr}`));
                        }
                        resolve(path.join(projects_silo_path, projName));
                })
            }
        } catch (err) {
            console.log(err);
            reject(new Error(`(cloneRepo) git-clone err ${err.name} :- ${err.message}`));
        }
    })
}

function buildImage(workdirpath, projName){
    return new Promise( (resolve, reject) => {
        try {
            dockerapi.buildImage({
              context: workdirpath,
              src: ['Dockerfile']
            }, {t: `${IP}:${registryPort}/${projName}:latest`}, function (err, stream) {
              if (err) {
                console.log(err);
                reject(new Error(`(buildImage) docker.buildImage err ${err.name} :- ${err.message}`));
              }
                dockerapi.modem.followProgress(stream, onFinished, (event) => {});

                function onFinished(err, output) {
                    if (err){ // docker image build was unsuccessful.
                        console.log(err);
                        reject(new Error(`followProgress - buildImage err: ${err}`))
                    }

                    fs.writeFileSync(projName+'-dockerlogs.txt', JSON.stringify(output)
                        , { flags: 'w' });
                    resolve(true);
                }
            });
        } catch(err) {
            console.log(err);
            reject(new Error(`(buildImage) err ${err.name} :- ${err.message}`));
        }
    })
}

function pushImage(projName){
    return new Promise( async (resolve, reject) => {
        try {
            const image = await dockerapi.listImages({
                filter: `${IP}:${registryPort}/${projName}`
            });
            image.push({
                name: `${IP}:${registryPort}/${projName}:latest`
            }, function (err, response) {
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
            const image = await dockerapi.listImages({
                filter: `${IP}:${registryPort}/${projName}`
            });
            let repoTags = image[0].RepoTags; // Gives an array of tags already present of the same image name.
            let allRepoTags = repoTags.filter(e => e.includes(`${IP}:${registryPort}/`)) // Only consider the registry tagged images.
            //let most_recent_img = allRepoTags[allRepoTags.length - 1] // which among them is the latest
            //let oldRepoTags = allRepoTags.filter(e => e !== most_recent_img)
            for (let i = 0; i < allRepoTags.length; i++) {
                const image = await dockerapi.getImage(allRepoTags[i]);
                console.log("img to be deleted: \n",image);
                await image.remove({remove: true}); 
            }
            const imagecheck = await dockerapi.listImages({
                filter: `${IP}:${registryPort}/${projName}`
            });
            console.log("images has been cleaned now")
            resolve(true);
        } catch(err) {
            console.log(err);
            if (err.message.includes("(HTTP code 404) no such image")){
                resolve(true);
            }
            reject(new Error('(removeImages) err: '+err));
        }
    })
}

function removeContainer(projName) {
    return new Promise( async (resolve,reject) => {
        try {   
            const container = await dockerapi.getContainer(projName);
            let resp = await container.remove({ force: true, v: true }); // v = remove 'volume' of container as well. 
            console.log("container - if any - has been removed now")
            resolve(resp);
        } catch(err) {
            console.log(err);
            if (err.message.includes("(HTTP code 404) no such container")){
                resolve(true);
            } else {
                reject(new Error(`(removeContainer) err ${err.name} :- ${err.message}`))
            }
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
            let tagname = await getTagName(projName);
            dockerapi.pull(`${IP}:${registryPort}/${projName}:${tagname}`, function (err, stream) {
              if (err) {
                console.log(err);
                reject(new Error(`docker-pull err ${err.name} :- ${err.message}`))
              }
              stream.on('data', (data) => {
                console.log("pullImage: \n",String(data));
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
            const image = await dockerapi.listImages({
                filter: `${IP}:${registryPort}/${projName}`
            });
            let repoTags = image[0].RepoTags; // Gives an array of tags already present of the same image name.
            let newRepoTags = repoTags.filter(e => e.includes(`${IP}:${registryPort}/`))
            // The last element of RepoTags[] is always the latest tagged image
            let most_recent_tag = newRepoTags[newRepoTags.length - 1].split(`${projName}:`)[1] // Eg: "192.168.1.101:7009/reactapp:v4"            
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
                var portBindings = data.NetworkSettings.Ports;
                //console.log("pbings: \n",portBindings);
                for (let pb in portBindings){
                    containerPort = pb;
                    ports.push(portBindings[pb][0].HostPort);
                }
                console.log("ports: \n", ports);
                for (let p in ports){
                    urls.push(`http://${IP}:${p} (${containerPort})`);
                }
                console.log("urls: \n", urls);
                resolve(urls);
            })
        } catch(err) {
            console.log(err);
            reject(new Error(`showLogs err: ${err}`));
        }
    })
}


module.exports = router