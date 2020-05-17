
const IP = require('ip').address(); // Get machine IP.
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');


module.exports = function cloneRepository(projName, branchName) {
    return new Promise( async (resolve, reject) => {
        try {
            let projects_silo_path = await mkProjSilo();
            let url = `http://${IP}:7005/projects/bare/${projName}.git`
            let projPath = path.join(projects_silo_path, projName+'-'+branchName);
            if (fs.existsSync(projPath)){
                fs.rmdir(projPath, {recursive:true}, (err) => {
                    if (err) {
                        console.log(err);
                        return reject(new Error(`Could not remove old workspace: ${err}`))
                    } else {
                        exec(`git clone -b ${branchName} ${url} ${projName}-${branchName} `, {
                            cwd: projects_silo_path,
                            shell: true
                        }, (err, stdout, stderr) => {
                            if (err) {
                                console.log(err);
                                return reject(new Error(`(cloneRepo) git-clone cli err ${err.name} :- ${err.message}`));
                            }
                            if (stderr) {
                                // The cloning output is apparently put inside "stderr"... so not picking that.
                                //console.log(stderr);
                                //reject(new Error(`(cloneRepo) git-clone cli stderr:\n ${stderr}`));
                            }
                            return resolve(path.join(projects_silo_path, projName+'-'+branchName));
                        })
                    }
                })
            } else {
                exec(`git clone -b ${branchName} ${url} ${projName}-${branchName}`, {
                        cwd: projects_silo_path,
                        shell: true
                    }, (err, stdout, stderr) => {
                        if (err) {
                            console.log(err);
                            return reject(new Error(`(cloneRepo) git-clone cli err ${err.name} :- ${err.message}`));
                        }
                        if (stderr) {
                            // The cloning output is apparently put inside "stderr"... so not picking that.
                            //console.log(stderr);
                            //reject(new Error(`(cloneRepo) git-clone cli stderr:\n ${stderr}`));
                        }
                        return resolve(path.join(projects_silo_path, projName+'-'+branchName));
                })
            }
        } catch (err) {
            console.log(err);
            return reject(new Error(`(cloneRepo) git-clone err ${err.name} :- ${err.message}`));
        }
    })
}

function mkProjSilo() {
    return new Promise( (resolve, reject) =>{
        try {
            let projects_silo_path = path.resolve(__dirname,'..','projects_silo');
            if(!fs.existsSync(projects_silo_path)){
                fs.mkdir(projects_silo_path, { recursive: true }, (err) => {
                    if (err) return reject(new Error(`mkdir proj silo err: ${err}`));
                    return resolve(projects_silo_path);
                })
            }
            resolve(projects_silo_path);
        } catch (err) {
            return reject(new Error('mkProjSilo err: '+err));
        }
    })
}