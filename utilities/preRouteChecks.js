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

let projectspath, barepath, workdirpath, barerepopath, projNamepath;

module.exports = async function preRouteChecks(majorHash, projName, username, branchToUpdate){
    
    projectspath = path.resolve(__dirname, '..', 'projects');
    barepath = path.resolve(__dirname, '..', 'projects', 'bare');
    barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git'); 
    projNamepath = path.resolve(__dirname, '..', 'projects', projName);
    workdirpath = path.resolve(__dirname, '..', 'projects', projName, username);

    return new Promise( async (resolve, reject) => {
        await projPathCheck(projectspath)
        .then ( async () => {
            await barePathCheck(barepath);
        })
        .then( async () => {
            await bareRepoPathCheck(barerepopath, majorHash, projName);
        })
        .then( async () => {
            await projNamePathCheck(projNamepath);
        })
        .then ( async () => {
            await workdirPathCheck(workdirpath, projName, username, branchToUpdate);
        })
        .then ( () => {
            resolve(true);
        })
        .catch( (err) => {
            reject(`preRouteCheck err: \n ${err}`);
        })
    })
}

async function projPathCheck(projectspath){
    return new Promise( (resolve, reject) => {
        if (!fs.existsSync(projectspath)){
            fs.mkdir(projectspath, (err) => {
                if (err) {
                    reject(`projPathCheck err: ${err}`);
                }
                resolve(true);
            })
        }
        resolve(true); // means projects/ exist.
    })
}


async function barePathCheck(barepath){
    return new Promise( (resolve, reject) => {
        if (!fs.existsSync(barepath)){
            fs.mkdir(barepath, (err) => {
                if (err) {
                    reject(`barePathCheck err: ${err}`);
                }
                resolve(true);
            })
        }
        resolve(true); // means projects/bare exist.
    })
}


async function bareRepoPathCheck(barerepopath, majorHash, projName) {
    return new Promise( async (resolve, reject) => {
        if (!fs.existsSync(barerepopath)) {
            try {
                await getFromIPFS(majorHash, projName);
                resolve(true);
            } catch(e) {
                reject(`bareRepoPathCheck err: ${e}`);
            }
        }
        resolve(true); // means projects/bare/projName.git exists.
    })
}

async function projNamePathCheck(projNamepath){
    return new Promise( (resolve,reject) => {
        if (!fs.existsSync(projNamepath)){
            fs.mkdir(projNamepath, (err) => {
                if (err) { 
                    reject(`projNamePathCheck err: ${err}`);
                }
                resolve(true);
            })
        }
        resolve(true); // means projects/projName/ exists
    })
}

async function workdirPathCheck(workdirpath, projName, username, branchToUpdate) {
    return new Promise( async (resolve, reject) => {
        if (!fs.existsSync(workdirpath)) {
            try {
                await cloneFromBare(projName,username, branchToUpdate);
                resolve(true);      
            } catch(err) {
                reject(`workdirPathCheck err: ${err}`);
            }
        }
        resolve(true); // means projects/projName/username/<workdir> exists
    })
}