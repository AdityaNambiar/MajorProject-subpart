const path = require('path');
const express = require('express');
const router = express.Router();
const fs = require('fs');
const jenkinsapi = require('jenkins-api');
const xmljsconv = require('xml-js')
const { exec } = require('child_process');


router.post('/integrateAndDeploy', async (req, res) => {
    try {
        let projName = req.body.projName || 'app1';
        let description = req.body.description || 'sample job via REST API';
        let jenkinsFile = req.body.jenkinsfile || 'Jenkinsfile';
        let branchName = req.body.branchName || 'master';
        let pollSCMSchedule = req.body.pollSCMSchedule || '';
        let jenkins = jenkinsapi.init("http://admin:11917eb8415f1013d725ed47be3eb2c869@localhost:8080");
        
        // Setup working directory for jenkins to access it.
        let workdirpath = await cloneRepo(projName); 
        // Read the sample pipeline job's XML:
        
        let pipelinexml = fs.readFileSync(path.resolve(__dirname,'..','pipeline.xml'), 'utf8');
        
        let pipelineObj = xmljsconv.xml2json(pipelinexml);
        console.log(pipelineObj);
        
        // Updating XML by creating nodes in variables
        let newPObj = await preparePipelineObj(description, pollSCMSchedule,
                        branchName, jenkinsFile, workdirpath);
        let newPXML = xmljsconv.js2xml(newPObj);

        let projXmlPath= await writeXmlToSilo(projName, newPXML);
        
        let xmlConfigString = await readXmlFromSilo();
        // username/API token
        jenkins.create_job(projName, xmlConfigString, (err, data) => {
            if (err) throw new Error(err)
            res.status(200)
            res.write("Job Created of name: "+projName);
        })
        jenkins.
            res.end();
    } catch (err) {
        console.log(err);
        res.status(400).send(`(cloneRepo) git-clone err ${err.name} :- ${err.message}`);
    }
})

function mkProjSilo() {
    return new Promise( (resolve, reject) =>{
        try {
            let projects_silo_path = path.resolve(__dirname,'..','projects_silo');
            if(!fs.existsSync(projects_silo_path)){
                fs.mkdir(projects_silo_path, { recursive: true }, (err) => {
                    if (err) reject(new Error(err));
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
                    if (err) reject(new Error(err));
                    resolve(xml_silo_path);
                })
            }
            resolve(xml_silo_path);
        } catch (err) {
            reject(new Error('mkProjSilo err: '+err));
        }
    })
}

function writeXmlToSilo(projName, newPXML){
    return new Promise( (resolve, reject) => {
        try {
            let xml_silo_path = await mkProjSilo();
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
    return new Promise( (resolve, reject) => {
        try {
            let xml_silo_path = await mkProjSilo();
            fs.writeFile(path.resolve(xml_silo_path,`${projName}.xml`), newPXML, { flags: 'w' }, (err) => {
                if (err) reject(new Error('could not write XML'+err))
                resolve(true);
            });
        } catch(err) {
            reject(new Error('(writeXmlToSilo) err'+err));
        }

    })
}
function cloneRepo(projName) {
    return new Promise( async (resolve, reject) => {
        try {
            let projects_silo_path = await mkProjSilo();
            let url = `http://localhost:7005/projects/bare/${projName}.git`
            
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
        } catch (err) {
            console.log(err);
            reject(new Error(`(cloneRepo) git-clone err ${err.name} :- ${err.message}`));
        }
    })
}

async function preparePipelineObj(description, pollSCMSchedule,
                        branchName, jenkinsFile, workdirpath) {
    try {
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
        
    } catch(err) {
        throw new Error("preparePipelineObj err: "+err);
    }
} 
module.exports = router