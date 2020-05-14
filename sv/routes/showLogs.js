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
            fs.writeFileSync('logop.txt', data);
            let logs = fs.readFileSync('logop.txt');
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

function showLogs(jenkins, jenkinslogsapi, projName){
    return new Promise( (resolve, reject) => {
        try {
            jenkins.last_build_info(projName, (err, data) =>{
                if (err) {
                    console.log(err);
                    reject(new Error(`(showLogs)  err ${err.name} :- ${err.message}`))
                }
                var log = jenkinslogsapi.build.logStream(projName, data.number);
                log.on('data', (txt) => {
                    resolve(txt);
                })
            });
        } catch(err) {
            console.log(err);
            reject(new Error(`showLogs err: ${err}`));
        }
    })
}
module.exports = router