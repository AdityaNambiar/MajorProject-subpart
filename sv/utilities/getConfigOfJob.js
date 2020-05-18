/**
    Get the configuration XML file of an existing job.
*/
const IP = require('ip').address(); // Get machine IP.
const jenkinsapi = require('jenkins-api');
const jenkins = jenkinsapi.init(`http://admin:112c43c287353d6ed5b169432ddb57a924@${IP}:8080`);

module.exports = function getConfigOfJob(jobName){
    return new Promise( (resolve, reject) => {
        try {
            jenkins.get_config_xml(jobName, function(err, data) {
                if (err === "Server returned unexpected status code: 404"){ 
                    return resolve(false) // means job does not exist
                } else {
                    return resolve(data); // means job does exist and send its xml 
                }
            });
        } catch(err) {
            console.log(err);
            return reject(new Error(`(doesJobExist) err: `+err));
        }
    })
}