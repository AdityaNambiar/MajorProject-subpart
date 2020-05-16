const path = require('path');
const express = require('express');
const router = express.Router();
const fs = require('fs');

const IP = require('ip').address(); // Get machine IP.
const jenkins = require('jenkins-api').init(`http://admin:11a4469a856bdf30c30a7c0053f822beaa@${IP}:8080`);

// Utility imports:
const checkJobStatus = require('../utilities/checkJobStatus');
const preparePipelineXML = require('../utilities/preparePipelineXML');
const getConfigOfJob = require('../utilities/getConfigOfJob');
const readXmlFromSilo = require('../utilities/readXmlFromSilo');
const writeXmlToSilo = require('../utilities/writeXmlToSilo');
const cloneRepository = require('../utilities/cloneRepository');
const rmWorkdir = require('../utilities/rmWorkdir');

router.post('/integrate', async (req, res) => {
        let projName = req.body.projName || "reactapp";
        let branchName = req.body.branchName || 'master';
        let timestamp = Date.now();
    try {
        let description = req.body.description || `${projName} build`;
        let jenkinsFile = req.body.jenkinsfile || 'Jenkinsfile';
        //let pollSCMSchedule = req.body.pollSCMSchedule || 'H/2 * * * *';
        // username/API token:
        
        // Setup working directory for jenkins to access it.
        let workdirpath = await cloneRepository(projName, branchName, timestamp); 
        console.log("timestamp: ", Date.now());
        // Updating XML by creating nodes in variables
        if (await doesJobExist(projName)){

            let existingXml = await getConfigOfJob(projName);
            let newPXML = await preparePipelineXML(description,
                            branchName, jenkinsFile, workdirpath, existingXml);

            await writeXmlToSilo(projName, newPXML);
            let xmlConfigString = await readXmlFromSilo(projName);

            console.log("job exists - updating it now");
            let queueId = await updateJob(projName, xmlConfigString);
            let isCompleted = await checkJobStatus(queueId, projName);
            if (isCompleted){
                console.log("build successful");
                await rmWorkdir(projName, branchName, timestamp);
                res.status(200).json({projName: projName, branchName: branchName, timestamp: timestamp});
            } else {
                console.log("build unsuccessful");
                await rmWorkdir(projName, branchName, timestamp);
                res.status(400).json({err:"Build Failed - Check logs!"});                
            }

        } else {

            let newPXML = await preparePipelineXML(description,
                            branchName, jenkinsFile, workdirpath, null);
           
            await writeXmlToSilo(projName, newPXML);
            let xmlConfigString = await readXmlFromSilo(projName);

            console.log("job does not exists - creating it now");
            let queueId = await createJob(projName, xmlConfigString);
            let isCompleted = await checkJobStatus(queueId, projName);
            if (isCompleted){
                console.log("build successful");
                await rmWorkdir(projName, branchName, timestamp);
                res.status(200).json({projName: projName, branchName: branchName, timestamp: timestamp});
            } else {
                console.log("build unsuccessful");
                await rmWorkdir(projName, branchName, timestamp);
                res.status(400).json({err:"Build Failed - Check logs!"});                
            }

        }
    } catch (err) {
        console.log(err);
        await rmWorkdir(projName, branchName, timestamp);
        res.status(400).json({err:`(integrate) main err ${err.name} :- ${err.message}`});
    }
})

function doesJobExist(projName){
    console.log("doesJobExist executed");
    return new Promise( (resolve, reject) => {
        try {
            jenkins.get_config_xml(projName, (err, data) => {
                if (err === "Server returned unexpected status code: 404"){ 
                    return resolve(false) // means job does not exist
                }   
                return resolve(true); // means job does exist
            });
        } catch(err) {
            console.log(err);
            return reject(new Error(`(doesJobExist) err: `+err));
        }
    })
}


function createJob(projName, xmlConfigString) {
    console.log("createJob executed");
    return new Promise( (resolve, reject) => {
        try {
            jenkins.create_job(projName, xmlConfigString, (err, data) => {
                if (err) {
                    console.log(err);
                    return reject(new Error("jenkins create-job: \n"+err))
                }
                jenkins.build(projName, function(err, data) {
                  if (err){ 
                    console.log(err);
                    return reject(new Error("jenkins build-job: \n"+err))
                  }
                 return resolve(data.queueId);
                });
            })
        } catch(err) {
            console.log(err);
            return reject(new Error(`(createJob) err ${err.name} :- ${err.message}`));
        }
    })
}
function updateJob(projName, xmlConfigString) {
    console.log("updateJob executed");
    return new Promise( (resolve, reject) => {
        try {
            jenkins.update_job(projName, xmlConfigString, (err, data) => {
                if (err) {
                    console.log(err);
                    return reject(new Error("jenkins update-job: \n"+err))
                }
                jenkins.build(projName, function(err, data) {
                  if (err){ 
                    console.log(err);
                    return reject(new Error("jenkins build-job: \n"+err))
                  }
                    return resolve(data.queueId);
                });
            })
        } catch(err) {
            console.log(err);
            return reject(new Error(`(updateJob) err ${err.name} :- ${err.message}`));
        }
    })
}



module.exports = router