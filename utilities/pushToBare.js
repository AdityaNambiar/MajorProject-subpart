/**
 * A utility that just implement `git push path(projects/bare/projName.git) master` - bare repo path.
 * 
 */

const { exec } = require('child_process');

module.exports = function pushToBare(barerepopath, workdirpath, branchName) {

    return new Promise((resolve, reject) => {
        exec(`git push '${barerepopath}' '${branchName}' `, {
            cwd: workdirpath,
            shell: true
        }, (err, stdout, stderr) => {
            if (err) {
                /*let err_arr = err.toString().split('\n');
                if (err_arr.some( (e) => e == `fatal: ${branchName} cannot be resolved to branch`)) 
                resolve(true)
                else  */
                console.log(err);
                reject(new Error(`git push cli err ${err.name} :- ${err.message}`));
            }
            if (stderr) console.log(`git push cli stderr: ${stderr}`); 
            console.log('git push cli stdout: ',stdout)
            resolve(true);
        })
        
    })
}