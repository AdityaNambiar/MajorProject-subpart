/**
	Every 5 seconds, look at Jenkins queue to know whether a build has been started or not (queue turned 'executable' or not) 
*/

const fs = require('fs');
const IP = require('ip').address();
const jenkinsbuildstatusapi = require('jenkins')({ baseUrl: `http://admin:11a4469a856bdf30c30a7c0053f822beaa@${IP}:8080`, crumbIssuer: true }); // name defines the only purpoe of importing this package here.
const jenkins = require('jenkins-api').init(`http://admin:11a4469a856bdf30c30a7c0053f822beaa@${IP}:8080`);


module.exports = function checkJobStatus(queueId, projName){
    return new Promise((resolve, reject) => {
        var queuedata = {};
        var builddata = {};
        try {
            var buildnumber = null;
            var queueVar =  setInterval(queuecheck,5000);
            var queuelabel = () => {
                    jenkins.queue_item(queueId, (err, data) =>{
                        if (err){
                                console.log(err);
                                return reject(new Error(`(checkJobStatus) queue-item err ${err.name} :- ${err.message}`))
                        } else {
                            //console.log("queue_item get: \n", data);
                            queuedata = data;
                        } 
                    })
                }
            function queuecheck(){
                if(!queuedata.hasOwnProperty("executable")){
                    queuelabel();
                } else{
                    clearInterval(queueVar); 
                    buildnumber = queuedata.executable.number;
                    // GET Build number.
                    fs.writeFileSync(projName+'-'+'currjob_buildno.txt', buildnumber);
                    var buildVar =  setInterval(buildcheck,5000);
                    builddata.building = true // Initially the build will be in this state.
                    var buildlabel = () => {
                        jenkinsbuildstatusapi.build.get(projName, buildnumber, function(err, data) {
                          if (err) {
                            console.log(err);
                            return reject(new Error(`(checkJobStatus) jenkins-build-get err ${err.name} :- ${err.message}`))
                          } else {
                              builddata = data;
                          }
                        })
                    }

                    function buildcheck() {
                        if (builddata.building == true){
                            buildlabel()
                        } else {
                            clearInterval(buildVar)
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