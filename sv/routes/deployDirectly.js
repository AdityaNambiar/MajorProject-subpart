const path = require('path');
const express = require('express');
const router = express.Router();
const fs = require('fs');
const { exec } = require('child_process');
const Docker = require('dockerode');
const dockerapi = new Docker();

router.post('/deployDirectly', async (req, res) => {

    try {
        let projName = req.body.projName;

        let workdirpath = await cloneRepo(projName);
        let stream = await buildImage(workdirpath, projName);
        let isCompleted = await isImageBuilt(stream);
        if (isCompleted){
            res.status(200).json({data: projName});
        } else {
            res.status(400).json({data:"Docker Build Failed - Check logs!"});                
        }
        console.log(resp);
    } catch (err) {
        console.log(err);
        res.status(400).send(`(deployDirectly) main err ${err.name} :- ${err.message}`);
    }
})
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
function cloneRepo(projName) {
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
                    exec(`git clone ${url} ${projName}`, {
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
                exec(`git clone ${url} ${projName}`, {
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

function imageTagChange(projName){
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
    /**
        - I guess this could be the log output function? Like showLogs for Jenkins output? 
        - Anyway, I want to show user the image build log. Same UI as Integration + Deploy EXCEPT now there should be a loader on top and not a ProgressBar.
    */
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
function pushToPrivReg(workdirpath, projName){
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