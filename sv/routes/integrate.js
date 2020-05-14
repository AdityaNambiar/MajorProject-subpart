const path = require('path');
const express = require('express');
const router = express.Router();
const fs = require('fs');
const jenkinsapi = require('jenkins-api');
const IP = require('ip').address();
const jenkinsbuildstatusapi = require('jenkins')({ baseUrl: `http://admin:11a4469a856bdf30c30a7c0053f822beaa@${IP}:8080`, crumbIssuer: true }); // name defines the only purpoe of importing this package here.
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
        let jenkins = jenkinsapi.init(`http://admin:11a4469a856bdf30c30a7c0053f822beaa@${IP}:8080`);
        
        // Setup working directory for jenkins to access it.
        let workdirpath = await cloneRepo(projName); 
        
        // Updating XML by creating nodes in variables
        if (await doesJobExist(jenkins, projName)){
            let existingXml = await getConfigOfJob(jenkins,projName);
            let newPObj = await preparePipelineObj(description, pollSCMSchedule,
                            branchName, jenkinsFile, workdirpath, existingXml);
            let newPXML = xmljsconv.js2xml(newPObj);

            let projXmlPath= await writeXmlToSilo(projName, newPXML);
            
            let xmlConfigString = await readXmlFromSilo(projName);

            console.log("job exists - updating it now");
            let queueId = await updateJob(jenkins, projName, xmlConfigString);
            var isCompleted = await checkJobStatus(jenkins, jenkinsbuildstatusapi, queueId, projName);
            if (isCompleted){
                res.status(200).json({data: projName, workdirpath: workdirpath});
            } else {
                res.status(400).json({data:"Build Failed - Check logs!"});                
            }
        } else {
            let newPObj = await preparePipelineObj(description, pollSCMSchedule,
                            branchName, jenkinsFile, workdirpath, null);
            let newPXML = xmljsconv.js2xml(newPObj);

            let projXmlPath= await writeXmlToSilo(projName, newPXML);
            
            let xmlConfigString = await readXmlFromSilo(projName);

            console.log("job does not exists - creating it now");
            let queueId = await createJob(jenkins, projName, xmlConfigString);
            var isCompleted = await checkJobStatus(jenkins, jenkinsbuildstatusapi, queueId, projName);
            if (isCompleted){
                console.log("build successful");
                res.status(200).json({data: projName, workdirpath: workdirpath});
            } else {
                console.log("build unsuccessful");
                res.status(400).json({data:"Build Failed - Check logs!"});                
            }
        }
    } catch (err) {
        console.log(err);
        res.status(400).json({data:`(integrate) main err ${err.name} :- ${err.message}`});
    }
})

function checkJobStatus(jenkins,jenkinsbuildstatusapi, queueId, projName){
    return new Promise((resolve, reject) => {
        var queuedata = {};
        var builddata = {};
        try {
            var buildnumber = null;
            var queueVar =  setInterval(queuecheck,5000);
            var queuelabel = () => {
                    jenkins.queue_item(queueId, (err, data) =>{
                        if (err){
                                console.log(err);
                                reject(new Error(`(checkJobStatus) queue-item err ${err.name} :- ${err.message}`))
                        }   
                        //console.log("queue_item get: \n", data);
                        queuedata = data;
                    })
                }
            function queuecheck(){
                if(!queuedata.hasOwnProperty("executable")){
                    queuelabel();
                } else{
                   clearInterval(queueVar); 
                    buildnumber = queuedata.executable.number;
                    fs.writeFileSync('currjob_buildno.txt', buildnumber);
                    var buildVar =  setInterval(buildcheck,5000);
                    builddata.building = true // Initially the build will be in this state.
                    var buildlabel = () => {
                        jenkinsbuildstatusapi.build.get(projName, buildnumber, function(err, data) {
                          if (err) {
                            console.log(err);
                            reject(new Error(`(checkJobStatus) jenkins-build-get err ${err.name} :- ${err.message}`))
                          }
                          builddata = data;
                        })
                    }

                    function buildcheck() {
                        if (builddata.building == true){
                            buildlabel()
                        } else {
                            clearInterval(buildVar)
                            if (builddata.result !== 'SUCCESS'){  
                                resolve(false);
                            } else {
                                resolve(true);
                            }
                        }
                    }
                }
            }
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
function getConfigOfJob(jenkins,projName){
    return new Promise( (resolve, reject) => {
        try {
            jenkins.get_config_xml(projName, function(err, data) {
                if (err === "Server returned unexpected status code: 404"){ 
                    resolve(false) // means job does not exist
                }   
                resolve(data); // means job does exist and send its xml 
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
                jenkins.build(projName, function(err, data) {
                  if (err){ 
                    console.log(err);
                    reject(new Error("jenkins build-job: \n"+err))
                  }
                    resolve(data.queueId);
                });
            })
        } catch(err) {
            console.log(err);
            reject(new Error(`(createJob) err ${err.name} :- ${err.message}`));
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
                jenkins.build(projName, function(err, data) {
                  if (err){ 
                    console.log(err);
                    reject(new Error("jenkins build-job: \n"+err))
                  }
                    resolve(data.queueId);
                });
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
            let url = `http://${IP}:7005/projects/bare/${projName}.git`
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

async function preparePipelineObj(description, pollSCMSchedule,
                        branchName, jenkinsFile, workdirpath, existingJobXml) {
    try {
        // Read the sample pipeline job's XML:
        let pipelinexml = '';
        if (existingJobXml == null)
            pipelinexml = fs.readFileSync(path.resolve(__dirname,'..','pipeline.xml'), 'utf8');
        else 
            pipelinexml = existingJobXml;
            
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