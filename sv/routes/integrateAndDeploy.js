const path = require('path');
const express = require('express');
const router = express.Router();
const fs = require('fs');
const jenkinsapi = require('jenkins-api');
const xmljsconv = require('xml-js')
router.post('/integrateAndDeploy', async (req, res) => {
    try {
        let projName = req.body.projName || 'app1';
        let description = req.body.description || 'sample job via REST API';
        let jenkinsFile = req.body.jenkinsfile;
        let url = "../../isomorph_git-test/nodeserv/projects/bare/new app.git"
        
        // Read the sample pipeline job's XML:
        var pipelinexml = fs.readFileSync(path.resolve(__dirname,'..','pipeline.xml'), 'utf8');
        var pipelineObj = xmljsconv.xml2json(pipelinexml);
        console.log(pipelineObj);
        // Updating XML by creating nodes in variables
        var descElement = [ {
            "type":"text",
            "text": description
        }]
        var branchElement = [{
            "type": "text",
            "text": branchName
        }]
        // ... Then appending in its JSON appropriate position and convert back to XML
        pipelineObj.elements[0].elements[0]["elements"] = descElement // set description of job.
        pipelineObj.elements[0].elements[3]["elements"] = branchElement // set branchName of job.
          
        var newPXML = xmljsconv.js2xml(pipelineObj);
        fs.writeFileSync(path.resolve(__dirname, '..', `${projName}.xml`), newPXML);
        var xmlConfigString = fs.readFileSync(path.resolve(__dirname, '..', `${projName}.xml`), 'utf8');
        // username/API token
        var jenkins = jenkinsapi.init("http://admin:11917eb8415f1013d725ed47be3eb2c869@localhost:8080");
        jenkins.create_job(projName, xmlConfigString, (err, data) => {
            if (err) console.log(err)
            res.status(200)
            res.write("Job Created of name: "+projName);
            res.end();
        })
    } catch (err) {
        console.log(err);
        res.status(400).send(`(cloneRepo) git-clone err ${err.name} :- ${err.message}`);
    }
})

module.exports = router