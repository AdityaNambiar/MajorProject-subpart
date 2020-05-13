const path = require('path');
const express = require('express');
const router = express.Router();
const fs = require('fs');
const { exec } = require('child_process');

router.post('/deploy', async (req, res) => {

    try {
        let projName = req.body.projName;
        console.log(projName);
        
            res.status(200).json({data: data});
    } catch (err) {
        console.log(err);
        res.status(400).send(`(deploy) main err ${err.name} :- ${err.message}`);
    }
})
function deploy(jenkins, projName){
    return new Promise( (resolve, reject) => {
        try {
            exec(`java -jar jenkins-cli.jar -s http://localhost:8080 console ${projName} > logsop.txt`, {
                cwd: path.join(__dirname, '..'),
                shell: true
            }, (err, stdout, stderr) => {
                if (err) {
                    console.log(err);
                    reject(new Error(`(showLogs) cli err ${err.name} :- ${err.message}`))
                }
                if (stderr) {
                    console.log(stderr);
                    reject(new Error(`(showLogs) cli stderr ${stderr}`))
                }
                let logs = fs.readFileSync('logsop.txt', 'utf8');
                resolve(logs);
            });
        } catch(err) {
            console.log(err);
            reject(new Error(`showLogs err: ${err}`));
        }
    })
}
module.exports = router