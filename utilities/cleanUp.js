/**
 * Remove username's work dir so as to obtain the latest work dir later on.
 */

const fs = require('fs');

module.exports = function cleanUp(workdirpath, errmsg) {
    return new Promise((resolve,reject) => {
    	var rgx = /\(pushChecker\) git-pull-catch-onConf err/; // Special err tag for when there is a conflict and any internal error occured.
		if (fs.existsSync(workdirpath) == true && rgx.test(errmsg) == false) { // if workdir does not exists and it does not have special tag associated with it in the catch block's err. 
	        fs.rmdir(workdirpath, { 
	            recursive: true
	        }, (err) => {
	            if (err) { console.log(err); reject(new Error(`rmWorkdir err ${err.name} :- ${err.message}`)); }
	            resolve(true);
	        })
		}
		resolve(true);
    })
}