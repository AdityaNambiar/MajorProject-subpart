/**
 * Utility to fetch "filenamearr" (obj with key as filename and value as their respective buffer)
*/

// Terminal execution:
const { exec } = require('child_process');

// isomorphic-git related imports and setup
const fs = require('fs');
const git = require('isomorphic-git');
git.plugins.set('fs',fs); // Bring your own file system 

const path = require('path');



module.exports = async function scanDir(branchNamepath) {

    return new Promise ( async (resolve, reject) => {
        scan(branchNamepath)
        .then( async (dir_list) => {
            let merge_arr = await formMergeArr(dir_list, branchNamepath);
            return merge_arr;
        })
        .then( (m_arr) => {
            resolve(m_arr);
        })
        .catch((e) => {
            reject(`main err: ${e}`);
        })
    })
}

async function scan(branchNamepath){
    return new Promise( async (resolve, reject) => {
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
    var mergearr = []
    var obj = { 
        'mergeid':'',
        'filenamelist': [],
        'title': ''
    }
    return new Promise( async (resolve, reject) => {
        try {
            for (var i = 0; i < dir_list.length; i++) {
                /**
                 * 1. read JSON file first to fetch type. (`${dir_list[i]}.json`)
                 * 2. compare the type (as written in ToDo)
                 * 3. According to type, perform the operations (as written in ToDo)
                 * 4. Form the mergeArr
                 */
                obj.mergeid = dir_list[i];
                obj.filenamelist = await gitDiff(path.join(branchNamepath, dir_list[i]));
                obj.title = "set appropriate title"
                mergearr.push(obj)
            }
            resolve(mergearr);
        } catch(e) {
            reject(`formMergeArr err: ${e}`)
        }
    })
}

async function gitDiff(workdirpath) {
    return new Promise( async (resolve, reject) => {
        try {
            var filename_list = [];
            await exec(`git diff --name-only --diff-filter=U`, {
                cwd: workdirpath,
                shell: true
            }, async (err, stdout, stderr) => {
                if (err) reject(`(gitDiff) unmerged file show cli err: ${err}`)
                if (stderr) reject(`(gitDiff) unmerged file show cli stderr: ${stderr}`)
                filename_list = [];
                filename_list = stdout.trim().split('\n');
                console.log('filename list: \n', filename_list);
                resolve(filename_list);
            })
        } catch(e) {
            reject(`(gitDiff) git-diff err: ${e}`)
        }
    })
}
