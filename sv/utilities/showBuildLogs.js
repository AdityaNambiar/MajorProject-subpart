
const IP = require('ip').address();
const jenkinslogsapi = require('jenkins')({ baseUrl: `http://admin:112c43c287353d6ed5b169432ddb57a924@${IP}:8080`, crumbIssuer: true }); // Naming this specially like this because I am only using this package for getting logStream.
 
//const fs = require('fs');

module.exports = function showLogs(jobName, buildnumber){
    return new Promise( (resolve, reject) => {
        try {
            //let buildnumber = fs.readFileSync(projName+'-'+'currjob_buildno.txt', 'utf8');
            var log = jenkinslogsapi.build.logStream(jobName, buildnumber);
            log.on('data', (txt) => {
                //console.log(data);
                //resolve(txt);
            })
            log.on('end', (end) => {
                console.log("stream ended, 'end' variable is: ",end);
                return resolve(end);
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
