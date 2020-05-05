/**
 * Utility to fetchulist of folders in branchNamepath.
*/

// Terminal execution:
const { exec } = require('child_process');

// isomorphic-git related imports and setup
const fs = require('fs');
const git = require('isomorphic-git');
git.plugins.set('fs',fs); // Bring your own file system 

const path = require('path');



module.exports = async function getMergeArr(projName, username, srcBranch, destBranch, branchNamepath) {

    return new Promise ( async (resolve, reject) => {
        try {
            let dir_list = await scan(branchNamepath)
            let mainMergeObj = await formMergeArr(dir_list, branchNamepath);
            resolve(mainMergeObj);
        } catch(e) {
            reject(`main err: ${e}`);
        }
    })
}

function scan(branchNamepath){
    return new Promise( (resolve, reject) => {
        try {
            fs.readdir(branchNamepath,(err,files)=>{
                if (err) reject(`readdir err: ${err}`)
                resolve(files);
            })
        } catch(e) {
            reject(`(scan) fs.readdir err: ${e}`)
        }
    })
}

async function formMergeArr(dir_list, branchNamepath){
    var normalMergeArr = [], specialMergeArr = [], type = '', title = '', filenamelist;
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
                // Step 1:
                fs.readFile(`${workdirpath}/${dir_list[i]}.json`, { encoding: 'utf-8' }, (err,data) => {
                    if (err) reject(`(formMergeArr) readJSON err: ${err}`);
                    type = data.type;
                    title = data.title;
                })
                if (type === "pull"){ // For folders where conflicts occured due to pull.
                    let resp = await gitMAbortAndPull(dir_list[i], workdirpath,  projName, username, branchName); // Returns an array. It could be a filenamelist or instruction array.
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
                    specialobj.instructions = setInstructionsArrForBranch(projName, username, branchName); 
                    specialobj.title = title;
                    specialMergeArr.push(specialobj);
                }
            }
            resolve(mainMergeObj);
        } catch(e) {
            reject(`formMergeArr err: ${e}`)
        }
    })
}

function gitMAbortAndPull(dir_name, workdirpath, projName, username, branchName) {
    return new Promise( async (resolve, reject) => {
        try {
            await gitMergeAbort(workdirpath)
            let filenames = await gitPull(dir_name, workdirpath, projName, username, branchName);
            resolve(filenames);
        } catch(e){ 
            reject(`gitMAbortAndPull err: ${e}`)
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
                if (err) reject(`gitMergeAbort cli err: ${err} `);
                if (stderr) reject(`gitMergeAbort cli stderr: ${stderr} `);
                console.log(`Merge Aborted: ${stdout}`);
                resolve(true);
            })
        }catch(e) {
            reject(`gitMergeAbort cli err: ${e} `);
        }
    })
}

function gitPull(dir_name, workdirpath, projName, username, branchName){

    return new Promise( async (resolve, reject) => {
        try {
            await exec(`git pull ${barerepopath}`, {
                cwd: workdirpath,
                shell: true
            }, async (err, stdout, stderr) => {
                console.log(stdout);
                var output = stdout.split('\n');
                var resp_arr = [];
                var arr = [];
                var elem_rgx = new RegExp(/CONFLICT/);
                var inbetweenbrackets_rgx = new RegExp(/\((.*)\)/); // defines capturing group for picking up the stuff within parenthesis
                if (output.some((e) => elem_rgx.test(e))){ // TRUE - if any output line consist of "CONFLICT" keyword in it. 
                    //output.push("CONFLICT (add/add): Merge conflict in DESC4")
                    //output.push("CONFLICT (modify/delete): Merge conflict in DESC4")
                    fs.writeFile(path.join(workdirpath, `${dir_name}.json`),{
                        type: 'pull',
                        title: 'Merge conflict raised during pull operation'
                    }, (err) => {
                        if (err) reject(`(pushChecker) gitPull-jsonWrite err: ${err}`)
                    })

                    for (var i = 0; i < output.length; i++){
                        if (output[i].match(inbetweenbrackets_rgx) != null) {
                            // form an array of types of conflict occured.. like ['content', 'add/add', 'modify/delete', 'content' etc..]
                            arr.push(output[i].match(inbetweenbrackets_rgx)[1]); 
                        }
                    }
                    if (!arr.every((e) => e == "content")){ // If the array contains anything else than "content" type conflicts. Throw the error with instructions.
                        fs.writeFile(path.join(workdirpath, `${dir_name}.json`), {
                            type: 'special',
                            title: 'Merge conflict raised during pull operation'
                        }, (err) => {
                            if (err) reject(`(pushChecker) gitPull-jsonWrite err: ${err}`)
                        })
                        resp_arr = [];
                        resp_arr.push("Please solve this merge conflict via CLI")
                        resp_arr.push(`1. git clone http://localhost:7005/projects/${projName}/${username} \n2. git checkout ${branchName} \n3. divcs pull origin \n- Fix your merge conflicts locally and commit them, then follow: \n1. divcs push origin master \n NOTE: Unless you will be pushing onto the remote repository, \nYour local commit history would not be present when you \n operate on the web interface.`)
                        resolve(resp_arr);
                    } else {
                        await exec(`git diff --name-only --diff-filter=U`, {
                            cwd: workdirpath,
                            shell: true
                        }, async (err, stdout, stderr) => {
                            if (err) console.log(`unmerged file show cli err: ${err}`)
                            if (stderr) console.log(`unmerged file show cli stderr: ${stderr}`)
                            resp_arr = [];
                            resp_arr = stdout.trim().split('\n');
                            console.log('filename arr: \n', resp_arr);
                            resolve(resp_arr);
                        })
                    }
                }
            })
        } catch(e) {
            reject(`(pushchecker) git-pull err: ${e}`)
        }
    })
}

function setInstructionsArrForBranch(projName, username, srcBranchName, destBranchName) {
    let filename_arr = [];
    filename_arr.push("Please solve this merge conflict via CLI")
    filename_arr.push(`1. git clone http://localhost:7005/projects/${projName}/${username} \n2. git checkout ${destBranchName} \n3. git merge ${srcBranchName} \n- Fix your merge conflicts locally and commit them, then follow: \n1. divcs push origin master \n NOTE: Unless you will be pushing onto the remote repository, \nYour local commit history would not be present when you \n operate on the web interface.`)
    return filename_arr;
}

function checkUnmergedFiles(workdirpath) {
    return new Promise( async (resolve, reject) => {
        try {
            var filename_list = [];
            await exec(`git diff --name-only --diff-filter=U`, {
                cwd: workdirpath,
                shell: true
            }, async (err, stdout, stderr) => {
                if (err) reject(`(checkUnmergedFiles) unmerged file show cli err: ${err}`)
                if (stderr) reject(`(checkUnmergedFiles) unmerged file show cli stderr: ${stderr}`)
                filename_list = [];
                filename_list = stdout.trim().split('\n');
                console.log('filename list: \n', filename_list);
                resolve(filename_list);
            })
        } catch(e) {
            reject(`(checkUnmergedFiles) unmerged file err: ${e}`)
        }
    })
}
