
const jenkinslogsapi = require('jenkins')({ baseUrl: 'http://admin:11a4469a856bdf30c30a7c0053f822beaa@localhost:8080', crumbIssuer: true }); // Naming this specially like this because I am only using this package for getting logStream.
 
const fs = require('fs');

module.exports = function showLogs(jenkins, jenkinslogsapi, projName){
    return new Promise( (resolve, reject) => {
        try {
            //let buildnumber = fs.readFileSync(projName+'-'+'currjob_buildno.txt', 'utf8');
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
