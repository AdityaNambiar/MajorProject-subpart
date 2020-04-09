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

let projectspath = path.resolve(__dirname, '..', 'projects');
let workdirpath, barerepopath, projNamepath;
module.exports = async function preRouteChecks(majorHash, projName, username){

    barerepopath = path.resolve(__dirname, '..', 'projects', projName+'.git'); 
    projNamepath = path.resolve(__dirname, '..', 'projects', projName);
    workdirpath = path.resolve(__dirname, '..', 'projects', projName, username);

    return new Promise( async (resolve, reject) => {
        projPathCheck(projectspath)
        .then( () => {
            bareRepoPathCheck(barerepopath,majorHash,projName);
        })
        .then( () => {
            projNamePathCheck(projNamepath);
        })
        .then ( () => {
            workdirPathCheck(workdirpath,projName, username);
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
        resolve(true); // means projects/projName.git exists.
    })
}

async function projNamePathCheck(projNamepath){
    return new Promise( (resolve,reject) => {
        if (!fs.existsSync(projNamepath)){
            fs.mkdir(projectspath, (err) => {
                if (err) { 
                    reject(`projNamePathCheck err: ${err}`);
                }
                resolve(true);
            })
        }
        resolve(true); // means projects/projName/ exists
    })
}

async function workdirPathCheck(workdirpath, projName, username) {
    return new Promise( async (resolve, reject) => {
        if (!fs.existsSync(workdirpath)) {
            try {
                await cloneFromBare(projName,username);
                resolve(true);      
            } catch(err) {
                reject(`workdirPathCheck err: ${err}`);
            }
        }
        resolve(true); // means projects/projName/<workdir> exists
    })
}