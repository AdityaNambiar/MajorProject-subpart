const path = require('path');
const express = require('express');
const router = express.Router();
const fs = require('fs');

const IP = require('ip').address(); // Get machine IP.
const jenkins = require('jenkins-api').init(`http://admin:112c43c287353d6ed5b169432ddb57a924@${IP}:8080`);

// Utility imports:
const checkJobStatus = require('../utilities/checkJobStatus');
const preparePipelineXML = require('../utilities/preparePipelineXML');
const getConfigOfJob = require('../utilities/getConfigOfJob');
const readXmlFromSilo = require('../utilities/readXmlFromSilo');
const writeXmlToSilo = require('../utilities/writeXmlToSilo');
const cloneRepository = require('../utilities/cloneRepository');
const rmWorkdir = require('../utilities/rmWorkdir');

router.post('/', async (req, res) => {
    // https://stackoverflow.com/questions/45876257/express-post-request-gives-err-empty-response
    // To get rid of NodeJS core timeout of 2 minutes if route is not sending response. See: https://github.com/expressjs/express/issues/2174
        //req.setTimeout(0); 
        //console.log("timestamp: ", Date.now());
        let projName = req.body.projName;
        let branchName = req.body.branchName;
    try {
        let jobName = `${projName}-${branchName}`;
        let description = req.body.description || `${projName} build`;
        let jenkinsFile = req.body.jenkinsfile || 'Jenkinsfile';
        //let pollSCMSchedule = req.body.pollSCMSchedule || 'H/2 * * * *';
        // username/API token:
        
        // Setup working directory for jenkins to access it.
        let workdirpath = await cloneRepository(projName, branchName); 
        // Updating XML by creating nodes in variables
        let jobExist = await doesJobExist(jobName);
        if (jobExist){

            let existingXml = await getConfigOfJob(jobName);
            let newPXML = await preparePipelineXML(description,
                            branchName, jenkinsFile, workdirpath, existingXml);

            await writeXmlToSilo(jobName, newPXML);
            let xmlConfigString = await readXmlFromSilo(jobName);

            //console.log("job exists - updating it now");
            let queueId = await updateJob(jobName, xmlConfigString);
            console.log("queueId: ",queueId);
            let isCompleted = await checkJobStatus(queueId, jobName);
            console.log("Build status (true if completed): ",isCompleted);
            if (isCompleted){
                console.log("build successful");
                await rmWorkdir(projName, branchName);
                return res.status(200).send({projName: projName, branchName: branchName});
            } else {
                console.log("build unsuccessful");
                await rmWorkdir(projName, branchName);
                return res.status(400).send({err:"Build Failed - Check logs!"});                
            }

        } else {

            let newPXML = await preparePipelineXML(description,
                            branchName, jenkinsFile, workdirpath, null);
           
            await writeXmlToSilo(jobName, newPXML);
            let xmlConfigString = await readXmlFromSilo(jobName);

            //console.log("job does not exists - creating it now");
            let queueId = await createJob(jobName, xmlConfigString);
            console.log("queueId: ",queueId);
            let isCompleted = await checkJobStatus(queueId, jobName);
            console.log("Build status (true if completed): ",isCompleted);
            if (isCompleted){
                console.log("build successful");
                await rmWorkdir(projName, branchName);
                return res.status(200).send({projName: projName, branchName: branchName});
            } else {
                console.log("build unsuccessful");
                await rmWorkdir(projName, branchName);
                return res.status(400).send({err:"Build Failed - Check logs!"});                
            }

        }
    } catch (err) {
        console.log(err);
        await rmWorkdir(projName, branchName);
        return res.status(400).send({err:`(integrate) main err ${err.name} :- ${err.message}`});
    }
})

function doesJobExist(jobName){
    //console.log("doesJobExist executed");
    return new Promise( (resolve, reject) => {
        try {
            jenkins.get_config_xml(jobName, (err, data) => {
                if (err === "Server returned unexpected status code: 404"){ 
                    return resolve(false) // means job does not exist
                }  else {
                    return resolve(true); // means job does exist
                }  
            });
        } catch(err) {
            console.log(err);
            return reject(new Error(`(doesJobExist) err: `+err));
        }
    })
}


function createJob(jobName, xmlConfigString) {
    console.log("Creating new job...");
    return new Promise( (resolve, reject) => {
        try {
            jenkins.create_job(jobName, xmlConfigString, (err, data) => {
                if (err) {
                    console.log(err);
                    return reject(new Error("jenkins create-job: \n"+err))
                } else {
                    jenkins.build(jobName, function(err, data) {
                      if (err){ 
                        console.log(err);
                        return reject(new Error("jenkins build-job: \n"+err))
                      } else {
                         return resolve(data.queueId);
                      }
                    });
                }
            })
        } catch(err) {
            console.log(err);
            return reject(new Error(`(createJob) err ${err.name} :- ${err.message}`));
        }
    })
}
function updateJob(jobName, xmlConfigString) {
    console.log("Updating existing job...");
    return new Promise( (resolve, reject) => {
        try {
            jenkins.update_job(jobName, xmlConfigString, (err, data) => {
                if (err) {
                    console.log(err);
                    return reject(new Error("jenkins update-job: \n"+err))
                } else {
                    jenkins.build(jobName, function(err, data) {
                      if (err){ 
                        console.log(err);
                        return reject(new Error("jenkins build-job: \n"+err))
                      } else {
                        return resolve(data.queueId);
                      }
                    })
                }
            })
        } catch(err) {
            console.log(err);
            return reject(new Error(`(updateJob) err ${err.name} :- ${err.message}`));
        }
    })
}



module.exports = router