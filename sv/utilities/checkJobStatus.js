/**
	Every 5 seconds, look at Jenkins queue to know whether a build has been started or not (queue turned 'executable' or not) 
*/

const fs = require('fs');
const IP = require('ip').address();
const jenkinsbuildstatusapi = require('jenkins')({ baseUrl: `http://admin:112c43c287353d6ed5b169432ddb57a924@${IP}:8080`, crumbIssuer: true }); // name defines the only purpoe of importing this package here.
const jenkins = require('jenkins-api').init(`http://admin:112c43c287353d6ed5b169432ddb57a924@${IP}:8080`);


module.exports = function checkJobStatus(queueId, jobName){
    return new Promise((resolve, reject) => {
        try {
            //var queueVar =  setInterval(queuecheck,5000);
            let queuelabel = () => {
                return new Promise( async (resolve, reject) => {
                    await jenkins.queue_item(queueId, (err, data) =>{
                        if (err){
                                console.log(err);
                                return reject(new Error(`(checkJobStatus) queue-item err ${err.name} :- ${err.message}`))
                        } else {
                            //console.log("queue_item get: \n", data);
                            return resolve(data);
                        } 
                    })
                })
            }
            async function queuecheck(){
                let queuedata = {};
                if(!queuedata.hasOwnProperty("executable")){
                    queuedata = await queuelabel();
                    queuecheck();
                } else{
                    //clearInterval(queueVar); 
                    let buildnumber = queuedata.executable.number;
                    // GET Build number.
                    fs.writeFileSync(jobName+'-'+'currjob_buildno.txt', buildnumber);
                    //var buildVar =  setInterval(buildcheck,5000);
                    let buildlabel = () => {
                        return new Promise( async (resolve, reject) => {
                            await jenkinsbuildstatusapi.build.get(jobName, buildnumber, (err, data) => {
                              if (err) {
                                console.log(err);
                                return reject(new Error(`(checkJobStatus) jenkins-build-get err ${err.name} :- ${err.message}`))
                              } else {
                                return resolve(data);
                              }
                            })
                        })
                    }

                    async function buildcheck() {
                        let builddata = null;
                        if (builddata == null || builddata.building == true){
                            builddata = await buildlabel();
                            buildcheck()
                        } else {
                            //clearInterval(buildVar)
                            if (builddata.result !== 'SUCCESS'){  
                                return resolve(false);
                            } else {
                                return resolve(true);
                            }
                        }
                    }
                }
            }
        } catch(err) {
            console.log(err);
            return reject(new Error(`(checkJobStatus) err ${err.name} :- ${err.message}`));
        }
    })
}