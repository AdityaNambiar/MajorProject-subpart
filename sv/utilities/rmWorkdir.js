/**
 * Remove username's work dir so as to obtain the latest work dir later on.
 */

 const path = require('path');
 const fs = require('fs');
module.exports = function rmWorkdir(projName, branchName, timestamp) {
    let workdirpath = path.join(process.cwd(), 'projects_silo', projName+'-'+branchName+'-'+timestamp);
    return new Promise((resolve,reject) => {
        fs.rmdir(workdirpath, { 
            recursive: true
        }, (err) => {
            if (err) { 
            	console.log(err); 
            	return reject(new Error(`rmWorkdir err ${err.name} :- ${err.message}`)); 
            } else {
	            return resolve(true);
            }
        })
    })
}
