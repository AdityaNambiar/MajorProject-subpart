const path = require('path');
const express = require('express');
const router = express.Router();

const { exec } = require('child_process');

router.post('/cloneRepo', async (req, res) => {
    try {
        let projName = req.body.projName || '';
        let url = "../../isomorph_git-test/nodeserv/projects/bare/new app.git"
        
        exec(`git clone ${url} ${projName}`, {
            cwd: '../../projects_silo',
            shell: true
        }, (err, stdout, stderr) => {
            if (err) {
                console.log(err);
                throw new Error(`(cloneRepo) git-clone cli err ${err.name} :- ${err.message}`);
            }
            if (stderr) {
                console.log(stderr);
                throw new Error(`(cloneRepo) git-clone cli stderr:\n ${stderr}`);
            }
            console.log(stdout);
        })
    } catch (err) {
        console.log(err);
        res.status(400).send(`(cloneRepo) git-clone err ${err.name} :- ${err.message}`);
    }
})

module.exports = router