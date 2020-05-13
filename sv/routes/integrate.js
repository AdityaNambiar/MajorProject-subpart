const path = require('path');
const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const jenkinsapi = require('jenkins-api');
const jenkinsbuildstatusapi = require('jenkins'); // name defines the only purpoe of importing this package here.
const xmljsconv = require('xml-js')
const { exec } = require('child_process');


router.post('/integrate', async (req, res) => {
    try {
        let projName = req.body.projName || "reactapp";
        let description = req.body.description || `${projName} build`;
        let jenkinsFile = req.body.jenkinsfile || 'Jenkinsfile';
        let branchName = req.body.branchName || 'master';
        let pollSCMSchedule = req.body.pollSCMSchedule || 'H/2 * * * *';
        // username/API token:
        let jenkins = jenkinsapi.init("http://admin:11917eb8415f1013d725ed47be3eb2c869@localhost:8080");
        
        // Setup working directory for jenkins to access it.
        let workdirpath = await cloneRepo(projName); 
        
        // Updating XML by creating nodes in variables
        let newPObj = await preparePipelineObj(description, pollSCMSchedule,
                        branchName, jenkinsFile, workdirpath);
        let newPXML = xmljsconv.js2xml(newPObj);

        let projXmlPath= await writeXmlToSilo(projName, newPXML);
        
        let xmlConfigString = await readXmlFromSilo(projName);

        if (await doesJobExist(jenkins, projName)){
            console.log("job exists - updating it now");
            await updateJob(jenkins, projName, xmlConfigString);

            let isCompleted = await checkJobStatus(jenkins, jenkinsbuildstatusapi, projName);
            if (isCompleted){
                res.status(200).json({data: projName});
            } else {
                res.status(400).json("Build Failed - Check logs!");                
            }
        } else {
            console.log("job does not exists - creating it now");
            let data = await createJob(jenkins, projName, xmlConfigString);
            let isCompleted = await checkJobStatus(jenkins, projName);
            if (isCompleted){
                res.status(200).json({data: projName});
            } else {
                res.status(400).json("Build Failed - Check logs!");                
            }
        }
    } catch (err) {
        console.log(err);
        res.status(400).send(`(integrateAndDeploy) main err ${err.name} :- ${err.message}`);
    }
})

function checkJobStatus(jenkins, projName){
    return new Promise((resolve, reject) => {
        try {
            jenkins.last_
            jenkins.build.get('example', 1, function(err, data) {
              if (err) {
                console.log(err);
                reject(new Error(`jenkins-build-get err ${err.name} :- ${err.message}`))
              }
              if (data.color == "blue"){
                resolve(true);
              } else {
                resolve(false);
              }
            });
        } catch(err) {
            console.log(err);
            reject(new Error(`(checkJobStatus) err ${err.name} :- ${err.message}`));
        }
    })
}
function doesJobExist(jenkins, projName){
    return new Promise( (resolve, reject) => {
        try {
            jenkins.get_config_xml(projName, function(err, data) {
                if (err === "Server returned unexpected status code: 404"){ 
                    resolve(false) // means job does not exist
                }   
                resolve(true); // means job does exist
            });
        } catch(err) {
            console.log(err);
            reject(new Error(`(doesJobExist) err: `+err));
        }
    })
}
function createJob(jenkins, projName, xmlConfigString) {
    return new Promise( (resolve, reject) => {
        try {
            jenkins.create_job(projName, xmlConfigString, (err, data) => {
                if (err) {
                    console.log(err);
                    reject(new Error("jenkins create-job: \n"+err))
                }
                resolve(data);
            })
        } catch(err) {
            console.log(err);
            throw new Error(`(createJob) err ${err.name} :- ${err.message}`);
        }
    })
}
function updateJob(jenkins, projName, xmlConfigString) {
    return new Promise( (resolve, reject) => {
        try {
            jenkins.update_job(projName, xmlConfigString, (err, data) => {
                if (err) {
                    console.log(err);
                    reject(new Error("jenkins update-job: \n"+err))
                }
                resolve(data);
            })
        } catch(err) {
            console.log(err);
            reject(new Error(`(updateJob) err ${err.name} :- ${err.message}`));
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
function mkXmlSilo() {
    return new Promise( (resolve, reject) =>{
        try {
            let xml_silo_path = path.resolve(__dirname,'..','xml_silo');
            if(!fs.existsSync(xml_silo_path)){
                fs.mkdir(xml_silo_path, { recursive: true }, (err) => {
                    if (err) reject(new Error(`mkdir xml silo err: ${err}`));
                    resolve(xml_silo_path);
                })
            }
            resolve(xml_silo_path);
        } catch (err) {
            reject(new Error('mkXmlSilo err: '+err));
        }
    })
}

function writeXmlToSilo(projName, newPXML){
    return new Promise( async (resolve, reject) => {
        try {
            let xml_silo_path = await mkXmlSilo();
            fs.writeFile(path.resolve(xml_silo_path,`${projName}.xml`), newPXML, { flags: 'w' }, (err) => {
                if (err) reject(new Error('could not write XML'+err))
                resolve(true);
            });
        } catch(err) {
            reject(new Error('(writeXmlToSilo) err'+err));
        }

    })
}

function readXmlFromSilo(projName){
    return new Promise( async (resolve, reject) => {
        try {
            let xml_silo_path = await mkXmlSilo();
            fs.readFile(path.resolve(xml_silo_path,`${projName}.xml`), 'utf8' , (err, data) => {
                if (err) reject(new Error('could not read XML'+err))
                resolve(data);
            });
        } catch(err) {
            reject(new Error('(readXmlFromSilo) err '+err));
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
                fs.remove(projPath, (err) => {
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

async function preparePipelineObj(description, pollSCMSchedule,
                        branchName, jenkinsFile, workdirpath) {
    try {
        // Read the sample pipeline job's XML:
        
        let pipelinexml = fs.readFileSync(path.resolve(__dirname,'..','pipeline.xml'), 'utf8');
        
        let pipelineObj = JSON.parse(xmljsconv.xml2json(pipelinexml));
        var descElement = [ {
            "type":"text",
            "text": description
        }]
        var scheduleElement = [{
            "type":"text",
            "text": pollSCMSchedule
        }]
        var branchElement = [{
            "type": "text",
            "text": branchName
        }]
        var jenkinsfileElement = [{
            "type":"text",
            "text": jenkinsFile
        }]
        var workdirElement = [{
            "type": "text",
            "text": workdirpath
        }]
        // ... Then appending in its JSON appropriate position and convert back to XML
        pipelineObj.elements[0]
                .elements[1]
                ["elements"] = descElement // set description of job.
        pipelineObj.elements[0] // 'flow-definition' 
                .elements[3] // 'properties'
                .elements[0] // 'PipelineTriggersJobProperty'
                .elements[0] // 'triggers'
                .elements[0] // 'SCMTrigger'
                .elements[0] // 'spec'
                ["elements"] = scheduleElement; // set poll scheduling of job.
        pipelineObj.elements[0] // 'flow-definition'
                .elements[4] // 'definition'
                .elements[0] // 'scm'
                .elements[1] // 'userRemoteConfigs'
                .elements[0] // 'plugins.git.UserRemoteConfig'
                .elements[0] // 'url'
                ["elements"] = workdirElement; // set project's working directory path
        pipelineObj.elements[0] // 'flow-definition'
                .elements[4] // 'definition'
                .elements[0] // 'scm'
                .elements[2] // 'branches'
                .elements[0] // 'plugins.git.BranchSpec'
                .elements[0] // 'name'
                ["elements"] = branchElement // set user's branchName to build
        pipelineObj.elements[0] // 'flow-definition'
                .elements[4] // 'definition'
                .elements[1] // 'scriptPath'
                ["elements"] = jenkinsfileElement // set user's Jenkinsfile name.
        return (pipelineObj);
    } catch(err) {
        throw new Error("preparePipelineObj err: "+err);
    }
} 
module.exports = router