/**
 * Remove username's work dir so as to obtain the latest work dir.
 */

const path = require('path');
const fs = require('fs');


let workdirpath;

module.exports = async function rmWorkdir(projName, username) {

    workdirpath = path.resolve(__dirname, '..', 'projects', projName, username);
    
    projNamepath = path.resolve(__dirname, '..', 'projects', projName);

    return new Promise( async (resolve, reject) => {
        fs.rmdir(workdirpath, { 
            recursive: true
        }, (err) => {
            if (err) reject('rmWorkdir err:'+err);
            resolve(true);
        })
    }) 
}