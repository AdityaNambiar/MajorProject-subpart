/**
 * Remove username's work dir so as to obtain the latest work dir later on.
 */

const fs = require('fs');

module.exports = function rmWorkdir(workdirpath) {
    return new Promise((resolve,reject) => {
        fs.rmdir(workdirpath, { 
            recursive: true
        }, (err) => {
            if (err) { console.log(err); reject(new Error(`rmWorkdir err ${err.name} :- ${err.message}`)); }
            resolve(true);
        })
    })
}