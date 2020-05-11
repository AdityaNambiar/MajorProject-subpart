const path = require('path');
const express = require('express');
const router = express.Router();
const jenkins = require('jenkins-api');

router.post('/integrateAndDeploy', async (req, res) => {
    try {
        let projName = req.body.projName || '';
        let jenkinsFile = req.body.jenkinsfile;
        let url = "../../isomorph_git-test/nodeserv/projects/bare/new app.git"
        
        // username/password
        var jenkins = jenkinsapi.init("http://admin:admin@localhost:8081");
        res.status(200).send({jenkins: jenkins, jenkinsfile: jenkinsFile})
    } catch (err) {
        console.log(err);
        res.status(400).send(`(cloneRepo) git-clone err ${err.name} :- ${err.message}`);
    }
})

module.exports = router