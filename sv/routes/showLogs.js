const path = require('path');
const express = require('express');
const router = express.Router();
const fs = require('fs');
const jenkinsapi = require('jenkins-api');


router.post('/showLogs', async (req, res) => {

    try {
        let projName = req.body.projName;
        console.log(projName);
        let jenkins = jenkinsapi.init("http://admin:11917eb8415f1013d725ed47be3eb2c869@localhost:8080");
        
        if (await doesJobExist(jenkins, projName)){
            console.log("job exists - it now");
            let data = await showLogs(jenkins, projName);
            res.status(200).send(data);
        } else {
            throw new Error("Job Build does not exist");
        }
    } catch (err) {
        console.log(err);
        res.status(400).send(`(integrateAndDeploy) main err ${err.name} :- ${err.message}`);
    }
})

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

function showLogs(jenkins, projName){
    return new Promise( (resolve, reject) => {
        try {
            jenkins.last_build_info(projName, (err, data) =>{
                if (err) {
                    console.log(err);
                    reject(new Error(`showLogs jenkins err: ${err}`))
                }
                console.log(data);
                resolve(data);
            })
        } catch(err) {
            console.log(err);
            reject(new Error(`showLogs err: ${err}`));
        }
    })
}
module.exports = router