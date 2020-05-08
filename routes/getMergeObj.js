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
    var projName = req.body.projName ;
    var branchToUpdate = req.body.branchToUpdate ;
    var url = `http://localhost:7005/projects/bare/${projName}.git`;

    var barerepopath = path.resolve(__dirname, '..', 'projects', 'bare', projName+'.git'); 
    var branchNamepath = path.resolve(__dirname, '..', 'projects', projName, branchToUpdate);

    try{
        let mainMergeObj = await getMergeArr(barerepopath, branchNamepath)
        res.status(200).send({ mainMergeObj: mainMergeObj, url: url});
    }catch(err){
        console.log(err);
        res.status(400).send(`(getMergeArr) err ${err.name} :- ${err.message}`);
    }
})

function getMergeArr(barerepopath, branchNamepath) {

    return new Promise ( async (resolve, reject) => {
        try {
            let dir_list = await scan(branchNamepath)
            let mainMergeObj = await formMergeArr(dir_list, barerepopath, branchNamepath);
            resolve(mainMergeObj);
        } catch(err) {
            console.log(err);
            reject(new Error(`main err ${err.name} :- ${err.message}`));
        }
    })
}

function scan(branchNamepath){
    return new Promise( (resolve, reject) => {
        try {
            fs.readdir(branchNamepath,(err,files)=>{
                if (err) { console.log(err); reject(new Error(`(scan) fs.readdir err ${err.name} :- ${err.message}`)) }
                resolve(files);
            })
        } catch(err) {
            console.log(err); 
            reject(new Error(`(getMergeObj) scan err ${err.name} :- ${err.message}`));
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
                var workdirpath = path.join(branchNamepath, dir_list[i]);
                //console.log("dir_list[i]: \n", dir_list[i]);
                var projName, branchName, pathArr;
                pathArr = workdirpath.split('/');
                projName = pathArr[pathArr.length - 3];
                branchName = pathArr[pathArr.length - 2];

                // Step 1:
                if (fs.existsSync(`${workdirpath}/${dir_list[i]}.json`)){
                    try {
                        var data = fs.readFileSync(`${workdirpath}/${dir_list[i]}.json`, 'utf8')
                        var jsondata = JSON.parse(data);
                        type = jsondata.type;
                        title = jsondata.title;
                    } catch (err) {
                        console.log(err); 
                        reject(new Error(`(formMergeArr) readJSON err ${err.name} :- ${err.message}`)); 
                    }

                    if (type === "pull"){ // For folders where conflicts occured due to pull.
                        let resp = await gitMAbortAndPull(dir_list[i], barerepopath, workdirpath,  projName, branchName)
                                    .catch( (err) => reject(new Error(`(formMergeArr) gitMAbortAndPull err ${err.name} :- ${err.message}`))); // Returns an array. It could be a filenamelist or instruction array.
                        if (resp[0] === "Please solve this merge conflict via CLI"){
                            specialobj = {}
                            specialobj.mergeid = dir_list[i];
                            specialobj.instructions = resp; // These instructions will be w.r.t to pull conflicts.
                            specialobj.title = title;
                            specialMergeArr.push(specialobj);
                        } else {
                            normalobj = {}
                            normalobj.mergeid = dir_list[i];
                            normalobj.filenamelist = resp;
                            normalobj.title = title;
                            normalMergeArr.push(normalobj);
                        }
                    } else if (type === "branch"){ // For folders where conflicts occured due to branch merges.
                        normalobj = {};
                        normalobj.mergeid = dir_list[i];
                        normalobj.filenamelist = await checkUnmergedFiles(workdirpath)
                                                .catch( (err) => reject(new Error(`(formMergeArr) checkUnmergedFiles err ${err.name} :- ${err.message}`)));
                        normalobj.title = title;
                        normalMergeArr.push(normalobj);
                        //console.log(normalMergeArr);
                    } else { // For folders where special conflicts occured.
                        specialobj = {}
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
                }
            }
            resolve(mainMergeObj);
        } catch(err) {
            console.log(err); 
            reject(new Error(`(getMergeObj) formMergeArr err ${err.name} :- ${err.message}`));
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
            reject(new Error(`(getMergeObj) gitMAbortAndPull err ${err.name} :- ${err.message}`));
        }
    })
}

function gitMergeAbort(workdirpath) {
    return new Promise((resolve, reject) => {
        try {
            exec(`git merge --abort`, {
                cwd: workdirpath,
                shell: true
            }, (err, stdout, stderr) => {
                if (err) { console.log(err); reject(new Error(`(getMergeObj) gitMergeAbort cli err ${err.name} :- ${err.message}`)); }
                if (stderr) { console.log(stderr); reject(new Error(`(getMergeObj) gitMergeAbort cli stderr :- ${stderr} `)); }
                console.log(`Merge Aborted! ( ${stdout} )`);
                resolve(true);
            })
        }catch(err) {
            console.log(err); 
            reject(new Error(`(getMergeObj) gitMergeAbort cli err ${err.name} :- ${err.message}`));
        }
    })
}

function gitPull(dir_name, barerepopath, workdirpath, projName, branchName){

    return new Promise((resolve, reject) => {
        try {
            exec(`git pull '${barerepopath}' '${branchName}'`, {
                cwd: workdirpath,
                shell: true
            }, (err, stdout, stderr) => {
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
                        reject(new Error(`(getMergeObj) gitPull-jsonWriteForPull err ${err.name} :- ${err.message}`))
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
                            reject(new Error(`(getMergeObj) gitPull-jsonWriteForSpecial err ${err.name} :- ${err.message}`))
                        }
                        resp_arr = [];
                        resp_arr.push("Please solve this merge conflict via CLI")
                        resp_arr.push(`1. git clone http://localhost:7005/projects/bare/${projName}.git \n2. git checkout ${branchName} \n3. divcs pull origin ${branchName} \n- Fix your merge conflicts locally and commit them, then follow: \n1. divcs push origin master \n NOTE: Unless you will be pushing onto the remote repository, \nYour local commit history would not be present when you \n operate on the web interface.`)
                        resolve(resp_arr);
                    } else {
                        exec(`git diff --name-only --diff-filter=U`, {
                            cwd: workdirpath,
                            shell: true
                        }, async (err, stdout, stderr) => {
                            if (err) { console.log(err); reject(new Error(`(getMergeObj) unmerged file show cli err ${err.name}: ${err.message}`)); }
                            if (stderr) { console.log(stderr); reject(new Error(`(getMergeObj) unmerged file show cli stderr: ${stderr}`)) }
                            resp_arr = [];
                            resp_arr = stdout.trim().split('\n');
                            //console.log('(getMergeObj) filename arr: \n', resp_arr);
                            resolve(resp_arr);
                        })
                    }
                }
            })
        } catch(err) {
            console.log(err);
            reject(new Error(`(getMergeObj) git-pull err ${err.name}:- ${err.message}`))
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
    return new Promise((resolve, reject) => {
        try {
            var filename_list = [];
            exec(`git diff --name-only --diff-filter=U`, {
                cwd: workdirpath,
                shell: true
            }, (err, stdout, stderr) => {
                if (err) { console.log(err); reject(new Error(`(checkUnmergedFiles) unmerged file show cli err ${err.name} :- ${err.message}`)); }
                if (stderr) { console.log(stderr); reject(new Error(`(checkUnmergedFiles) unmerged file show cli stderr: ${stderr}`)); }
                filename_list = [];
                filename_list = stdout.trim().split('\n');
                //console.log('filename list: \n', filename_list);
                resolve(filename_list);
            })
        } catch(err) {
            reject(new Error(`(checkUnmergedFiles) unmerged file err ${err.name} :- ${err.message}`))
        }
    })
}

module.exports = router