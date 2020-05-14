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
function pushToDockerHub(workdirpath, projName){
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
function pullFromDockerHub(workdirpath, projName){
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