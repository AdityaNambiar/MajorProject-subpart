/**
 * If bare repo not exists,
 *      getFromIPFS(ipfshash, projName);
 *      If projName folder not exists,
 *          fs.mkdir(path.resolve('projects',projName)
 * If work dir repo not exists,
 *      clone the bare repo by cloneFromBare(projName, username)
 */



// Misc:
const getFromIPFS = require('../utilities/getFromIPFS');
const cloneFromBare = require('../utilities/cloneFromBare');

const path = require('path');
const fs = require('fs');

module.exports = function preRouteChecks(majorHash, projName, username, timestamp, branchToUpdate){
    
    var projectspath = path.resolve(__dirname, '..', 'projects');
    var barepath = path.resolve(__dirname, '..', 'projects', 'bare');
    var barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git'); 
    var projNamepath = path.resolve(__dirname, '..', 'projects', projName);
    var branchNamepath = path.resolve(__dirname, '..', 'projects', projName, branchToUpdate);
    var workdirpath = path.resolve(__dirname, '..', 'projects', projName, branchToUpdate, username+timestamp);

    return new Promise( async (resolve, reject) => {
        try {
            await projPathCheck(projectspath)
            await barePathCheck(barepath);
            await bareRepoPathCheck(barerepopath, majorHash, projName);
            await projNamePathCheck(projNamepath);
            await branchNamePathCheck(branchNamepath);
            await workdirPathCheck(workdirpath, projName, username, timestamp, branchToUpdate);
            resolve(true);
        } catch(err) {
            console.log(err);
            reject(new Error(`preRouteCheck err ${err.name}: \n ${err.message}`));
        }
    })
}

function projPathCheck(projectspath){
    return new Promise( (resolve, reject) => {
        if (!fs.existsSync(projectspath)){
            fs.mkdir(projectspath, (err) => {
                if (err) {
                    console.log(err);
                    reject(new Error(`projPathCheck err ${err.name} :- ${err.message}`));
                }
                resolve(true);
            })
        }
        resolve(true); // means projects/ exist.
    })
}

function barePathCheck(barepath){
    return new Promise( (resolve, reject) => {
        if (!fs.existsSync(barepath)){
            fs.mkdir(barepath, (err) => {
                if (err) {
                    console.log(err); 
                    reject(new Error(`barePathCheck err ${err.name} :- ${err.message}`));
                }
                resolve(true);
            })
        }
        resolve(true); // means projects/bare exist.
    })
}

function bareRepoPathCheck(barerepopath, majorHash, projName) {
    return new Promise( async (resolve, reject) => {
        if (!fs.existsSync(barerepopath)) {
            try {
                await getFromIPFS(majorHash, projName);
                resolve(true);
            } catch(err) {
                console.log(err);
                reject(new Error(`bareRepoPathCheck err ${err.name} :- ${err.message}`));
            }
        }
        resolve(true); // means projects/bare/projName.git exists.
    })
}

function projNamePathCheck(projNamepath){
    return new Promise( (resolve,reject) => {
        if (!fs.existsSync(projNamepath)){
            fs.mkdir(projNamepath, (err) => {
                if (err) { 
                    console.log(err);
                    reject(new Error(`projNamePathCheck err ${err.name} :- ${err.message}`));
                }
                resolve(true);
            })
        }
        resolve(true); // means projects/projName/ exists
    })
}
function branchNamePathCheck(branchNamepath) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(branchNamepath)){
            fs.mkdir(branchNamepath, (err) => {
                if (err) { 
                    console.log(err);
                    reject(new Error(`branchNamePathCheck err ${err.name} :- ${err.message}`));
                }
                resolve(true);
            })
        }
        resolve(true); // means projects/projName/branchName exists
    })
}

function workdirPathCheck(workdirpath, projName, username, timestamp, branchToUpdate) {
    return new Promise( async (resolve, reject) => {
        if (!fs.existsSync(workdirpath)) {
            try {
                await cloneFromBare(workdirpath, projName, username, timestamp, branchToUpdate);
                resolve(true);      
            } catch(err) {
                console.log(err);
                reject(new Error(`workdirPathCheck err ${err.name}: ${err.message}`));
            }
        }
        resolve(true); // means projects/projName/branchName/username+timestamp exists
    })
}