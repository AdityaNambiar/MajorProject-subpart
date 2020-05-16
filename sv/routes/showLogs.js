const path = require('path');
const express = require('express');
const router = express.Router();
const fs = require('fs');
const jenkinsapi = require('jenkins-api');
const jenkinslogsapi = require('jenkins')({ baseUrl: 'http://admin:11a4469a856bdf30c30a7c0053f822beaa@localhost:8080', crumbIssuer: true }); // Naming this specially like this because I am only using this package for getting logStream.
const { exec } = require('child_process');

router.post('/showLogs', async (req, res) => {

    try {
        let projName = req.body.projName;
        console.log(projName);
        let jenkins = jenkinsapi.init("http://admin:11a4469a856bdf30c30a7c0053f822beaa@localhost:8080");
        
        if (await doesJobExist(jenkins, projName)){
            console.log("job exists - fetching logs now");
            let data = await showLogs(jenkins, jenkinslogsapi, projName);
            fs.writeFileSync(projName+'-'+'logop.txt', data);
            let logs = fs.readFileSync(projName+'-'+'logop.txt');
            res.status(200).send(logs);
        } else {
            throw new Error("Job Build does not exist");
        }
    } catch (err) {
        console.log(err);
        res.status(400).send(`(showLogs) main err ${err.name} :- ${err.message}`);
    }
})

function doesJobExist(jenkins, projName){
    return new Promise( (resolve, reject) => {
        try {
            console.log(projName);
            jenkins.get_config_xml(projName, function(err, data) {
                if (err === "Server returned unexpected status code: 404"){ 
                    console.log(err);
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

function showLogs(jenkins, jenkinslogsapi, projName){
    return new Promise( (resolve, reject) => {
        try {
            let buildnumber = fs.readFileSync(projName+'-'+'currjob_buildno.txt', 'utf8');
            var log = jenkinslogsapi.build.logStream(projName, buildnumber);
            log.on('data', (txt) => {
                resolve(txt);
            })
            log.on('error', (err) => {
                console.log(err);
            })
        } catch(err) {
            console.log(err);
            reject(new Error(`showLogs err: ${err}`));
        }
    })
}
module.exports = router