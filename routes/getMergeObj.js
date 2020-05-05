/**
 * Add a new branch in git repo:
 */
// Misc:
const preRouteChecks = require('../utilities/preRouteChecks');

const { exec } = require('child_process');

// isomorphic-git related imports and setup
const fs = require('fs-extra');
const git = require('isomorphic-git'); 

const path = require('path');
const express = require('express');
const router = express.Router();

router.post('/getMergeObj', async (req,res) => {
    var projName = req.body.projName.replace(/\s/g,'-');
    var username = req.body.username.replace(/\s/g,'-');
    var curr_majorHash = req.body.majorHash;  // latest
    var branchToUpdate = req.body.branchToUpdate.replace(/\s/g,'-');
    var url = `http://localhost:7005/projects/bare/${projName}.git`;

    var timestamp = Date.now();

    var barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git'); 
    var branchNamepath = path.resolve(__dirname, '..', 'projects', projName, branchToUpdate);

    try{
        await preRouteChecks(curr_majorHash, projName, username, timestamp, branchToUpdate)
        let mainMergeObj = await getMergeArr(barerepopath, branchNamepath)
        res.status(200).send({ mainMergeObj: mainMergeObj, url: url});
    }catch(e){
        res.status(400).send(`main caller err: ${e}`);
    }
})

async function getMergeArr(barerepopath, branchNamepath) {

    return new Promise ( async (resolve, reject) => {
        try {
            let dir_list = await scan(branchNamepath)
            let mainMergeObj = await formMergeArr(dir_list, barerepopath, branchNamepath);
            resolve(mainMergeObj);
        } catch(err) {
            console.log(err);
            reject(`main err ${e.name} :- ${e.message}`);
        }
    })
}

function scan(branchNamepath){
    return new Promise( (resolve, reject) => {
        try {
            fs.readdir(branchNamepath,(err,files)=>{
                if (err) { console.log(err); reject(`readdir err ${err.name} :- ${err.message}`) }
                resolve(files);
            })
        } catch(err) {
            console.log(err); 
            reject(`(scan) fs.readdir err ${err.name} :- ${err.message}`);
        }
    })
}

async function formMergeArr(dir_list, barerepopath, branchNamepath){
    var normalMergeArr = [], specialMergeArr = [], type = '', title = '';
    var normalobj = { 
        mergeid:'',
        filenamelist: [],
        title: ''
    }
    var specialobj = {
        mergeid: '',
        instructions: [],
        title: ''
    }
    var mainMergeObj = {
        normal: normalMergeArr,
        special: specialMergeArr
    };
    return new Promise( async (resolve, reject) => {
        try {
            for (var i = 0; i < dir_list.length; i++) {
                /**
                 * 1. read JSON file first to fetch type. (`${dir_list[i]}.json`)
                 * 2. compare the type (as written in ToDo)
                 * 3. According to type, perform the operations (as written in ToDo)
                 * 4. Form the mergeArr
                 */
                let workdirpath = path.join(branchNamepath, dir_list[i]);
                var projName, branchName, pathArr;
                pathArr = workdirpath.split('/');
                projName = pathArr[pathArr.length - 3];
                branchName = pathArr[pathArr.length - 2];

                // Step 1:
                fs.readFile(`${workdirpath}/${dir_list[i]}.json`, { encoding: 'utf-8' }, async (err,data) => {
                    if (err) { console.log(err); reject(`(formMergeArr) readJSON err ${err.name} :- ${err.message}`); }
                    type = data.type;
                    title = data.title;
                    if (type === "pull"){ // For folders where conflicts occured due to pull.
                        let resp = await gitMAbortAndPull(dir_list[i], barerepopath, workdirpath,  projName, branchName); // Returns an array. It could be a filenamelist or instruction array.
                        if (resp[0] === "Please solve this merge conflict via CLI"){
                            specialobj.mergeid = dir_list[i];
                            specialobj.instructions = resp; // These instructions will be w.r.t to pull conflicts.
                            specialobj.title = title;
                            specialMergeArr.push(specialobj);
                        } else {
                            normalobj.mergeid = dir_list[i];
                            normalobj.filenamelist = resp;
                            normalobj.title = title;
                            normalMergeArr.push(normalobj);
                        }
                    } else if (type === "branch"){ // For folders where conflicts occured due to branch merges.
                        normalobj.mergeid = dir_list[i];
                        normalobj.filenamelist = await checkUnmergedFiles(workdirpath);
                        normalobj.title = title;
                        normalMergeArr.push(normalobj);
                    } else { // For folders where special conflicts occured.
                        specialobj.mergeid = dir_list[i];
                        specialobj.title = title;
                        // For the branch merge conflict, hard coded titles must be like: 
                        // `Merge conflict raised when merging ${branchName} into ${branchToUpdate}`
                        let branchNameListFromTitle = title.split("merging ")[1].split(" into "); 
                        let srcBranchName = branchNameListFromTitle[0];
                        let destBranchName = branchNameListFromTitle[1];
                        specialobj.instructions = setInstructionsArrForBranch(projName, srcBranchName, destBranchName); 
                        specialMergeArr.push(specialobj);
                    }
                })
            }
            resolve(mainMergeObj);
        } catch(err) {
            console.log(err); 
            reject(`formMergeArr err ${err.name} :- ${err.message}`);
        }
    })
}

function gitMAbortAndPull(dir_name, barerepopath, workdirpath, projName, branchName) {
    return new Promise( async (resolve, reject) => {
        try {
            await gitMergeAbort(workdirpath)
            let resp = await gitPull(dir_name, barerepopath, workdirpath, projName, branchName);
            resolve(resp); // Returns an array. It could be a filenamelist or instruction array. 
        } catch(err){
            console.log(err);  
            reject(`gitMAbortAndPull err ${err.name} :- ${err.message}`);
        }
    })
}

function gitMergeAbort(workdirpath) {
    return new Promise( async (resolve, reject) => {
        try {
            await exec(`git merge --abort`, {
                cwd: workdirpath,
                shell: true
            }, async (err, stdout, stderr) => {
                if (err) { console.log(err); reject(`gitMergeAbort cli err ${err.name} :- ${err.message}`); }
                if (stderr) { console.log(stderr); reject(`gitMergeAbort cli stderr :- ${stderr} `); }
                console.log(`Merge Aborted! ( ${stdout} )`);
                resolve(true);
            })
        }catch(err) {
            console.log(err); 
            reject(`gitMergeAbort cli err ${err.name} :- ${err.message}`);
        }
    })
}

function gitPull(dir_name, barerepopath, workdirpath, projName, branchName){

    return new Promise( async (resolve, reject) => {
        try {
            await exec(`git pull ${barerepopath} ${branchName}`, {
                cwd: workdirpath,
                shell: true
            }, async (err, stdout, stderr) => {
                //if (err) { console.log(err); reject(`gitPull cli err ${err.name} :- ${err.message}`); }
                //if (stderr) { console.log(stderr); reject(`gitPull cli stderr :- ${stderr} `); }
                console.log(stdout);
                var output = stdout.split('\n');
                var resp_arr = [];
                var arr = [];
                var elem_rgx = new RegExp(/CONFLICT/);
                var inbetweenbrackets_rgx = new RegExp(/\((.*)\)/); // defines capturing group for picking up the stuff within parenthesis
                if (output.some((e) => elem_rgx.test(e))){ // TRUE - if any output line consist of "CONFLICT" keyword in it. 
                    //output.push("CONFLICT (add/add): Merge conflict in DESC4")
                    //output.push("CONFLICT (modify/delete): Merge conflict in DESC4")
                    try {
                        fs.writeFileSync(path.join(workdirpath, `${dir_name}.json`),{
                            type: 'pull',
                            title: `Merge conflict raised pulling ${branchName} branch`
                        })
                    } catch(err) {
                        console.log(err);
                        reject(`(getMergeObj) gitPull-jsonWriteForPull err ${err.name} :- ${err.message}`)
                    }
                    for (var i = 0; i < output.length; i++){
                        if (output[i].match(inbetweenbrackets_rgx) != null) {
                            // form an array of types of conflict occured.. like ['content', 'add/add', 'modify/delete', 'content' etc..]
                            arr.push(output[i].match(inbetweenbrackets_rgx)[1]); 
                        }
                    }
                    if (!arr.every((e) => e == "content")){ // If the array contains anything else than "content" type conflicts. Throw the error with instructions.
                        try{
                            fs.writeFileSync(path.join(workdirpath, `${dir_name}.json`), {
                                type: 'special',
                                title: `Merge conflict raised pulling ${branchName} branch`
                            })
                        } catch(err) {
                            console.log(err);
                            reject(`(getMergeObj) gitPull-jsonWriteForSpecial err ${err.name} :- ${err.message}`)
                        }
                        resp_arr = [];
                        resp_arr.push("Please solve this merge conflict via CLI")
                        resp_arr.push(`1. git clone http://localhost:7005/projects/bare/${projName}.git \n2. git checkout ${branchName} \n3. divcs pull origin ${branchName} \n- Fix your merge conflicts locally and commit them, then follow: \n1. divcs push origin master \n NOTE: Unless you will be pushing onto the remote repository, \nYour local commit history would not be present when you \n operate on the web interface.`)
                        resolve(resp_arr);
                    } else {
                        await exec(`git diff --name-only --diff-filter=U`, {
                            cwd: workdirpath,
                            shell: true
                        }, async (err, stdout, stderr) => {
                            if (err) { console.log(err); reject(` (getMergeObj) unmerged file show cli err ${err.name}: ${err.message}`); }
                            if (stderr) { console.log(stderr); reject(` (getMergeObj) unmerged file show cli stderr: ${stderr}`) }
                            resp_arr = [];
                            resp_arr = stdout.trim().split('\n');
                            console.log('(getMergeObj) filename arr: \n', resp_arr);
                            resolve(resp_arr);
                        })
                    }
                }
            })
        } catch(err) {
            console.log(err);
            reject(`(getMergeObj) git-pull err ${err.name}:- ${err.message}`)
        }
    })
}

function setInstructionsArrForBranch(projName, srcBranchName, destBranchName) {
    let instruction_arr = [];
    instruction_arr.push("Please solve this merge conflict via CLI")
    instruction_arr.push(`1. git clone http://localhost:7005/projects/bare/${projName}.git \n2. git checkout ${destBranchName} \n3. git merge ${srcBranchName} \n- Fix your merge conflicts locally and commit them, then follow: \n1. divcs push origin master \n NOTE: Unless you will be pushing onto the remote repository, \nYour local commit history would not be present when you \n operate on the web interface.`)
    return instruction_arr;
}

function checkUnmergedFiles(workdirpath) {
    return new Promise( async (resolve, reject) => {
        try {
            var filename_list = [];
            await exec(`git diff --name-only --diff-filter=U`, {
                cwd: workdirpath,
                shell: true
            }, async (err, stdout, stderr) => {
                if (err) { console.log(err); reject(`(checkUnmergedFiles) unmerged file show cli err ${err.name} :- ${err.message}`); }
                if (stderr) { console.log(stderr); reject(`(checkUnmergedFiles) unmerged file show cli stderr: ${stderr}`); }
                filename_list = [];
                filename_list = stdout.trim().split('\n');
                console.log('filename list: \n', filename_list);
                resolve(filename_list);
            })
        } catch(err) {
            reject(`(checkUnmergedFiles) unmerged file err: ${e}`)
        }
    })
}


module.exports = router