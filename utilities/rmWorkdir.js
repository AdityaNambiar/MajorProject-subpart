/**
 * Remove username's work dir so as to obtain the latest work dir.
 */

const path = require('path');
const fs = require('fs');


module.exports = async function rmWorkdir(workdirpath) {
    return new Promise( async (resolve, reject) => {
        fs.rmdir(workdirpath, { 
            recursive: true
        }, (err) => {
            if (err) reject('rmWorkdir err:'+err);
            resolve(true);
        })
    }) 
}