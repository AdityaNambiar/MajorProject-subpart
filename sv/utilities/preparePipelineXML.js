/**
 	1. Take the existing or sample XML file for pipeline jobs
	2. Convert XML to JSON.
	3. Update the JSON.
	4. Convert JSON to XML.
	5. Return the updated XML back.
*/

const fs = require('fs');
const path = require('path');
const xmljsconv = require('xml-js')

module.exports = async function preparePipelineXML(description,
                        branchName, jenkinsFile, workdirpath, existingJobXml) {
    try {
        // Read the sample pipeline job's XML:
        let pipelinexml = '';
        if (existingJobXml == null)
            pipelinexml = fs.readFileSync(path.resolve(__dirname,'..','pipeline.xml'), 'utf8');
        else 
            pipelinexml = existingJobXml;
            
        let pipelineObj = JSON.parse(xmljsconv.xml2json(pipelinexml));
        var descElement = [ {
            "type":"text",
            "text": description
        }]
        /*var scheduleElement = [{
            "type":"text",
            "text": pollSCMSchedule
        }]*/
        var branchElement = [{
            "type": "text",
            "text": branchName
        }]
        var jenkinsfileElement = [{
            "type":"text",
            "text": jenkinsFile
        }]
        var workdirElement = [{
            "type": "text",
            "text": workdirpath
        }]
        // ... Then appending in its JSON appropriate position and convert back to XML
        pipelineObj.elements[0]
                .elements[1]
                ["elements"] = descElement // set description of job.
        /*pipelineObj.elements[0] // 'flow-definition' 
                .elements[3] // 'properties'
                .elements[0] // 'PipelineTriggersJobProperty'
                .elements[0] // 'triggers'
                .elements[0] // 'SCMTrigger'
                .elements[0] // 'spec'
                ["elements"] = scheduleElement; // set poll scheduling of job.*/
        pipelineObj.elements[0] // 'flow-definition'
                .elements[4] // 'definition'
                .elements[0] // 'scm'
                .elements[1] // 'userRemoteConfigs'
                .elements[0] // 'plugins.git.UserRemoteConfig'
                .elements[0] // 'url'
                ["elements"] = workdirElement; // set project's working directory path
        pipelineObj.elements[0] // 'flow-definition'
                .elements[4] // 'definition'
                .elements[0] // 'scm'
                .elements[2] // 'branches'
                .elements[0] // 'plugins.git.BranchSpec'
                .elements[0] // 'name'
                ["elements"] = branchElement // set user's branchName to build
        pipelineObj.elements[0] // 'flow-definition'
                .elements[4] // 'definition'
                .elements[1] // 'scriptPath'
                ["elements"] = jenkinsfileElement // set user's Jenkinsfile name.

        let pipelineXML = xmljsconv.js2xml(pipelineObj);
        return (pipelineXML);
    } catch(err) {
        throw new Error("preparePipelineXML err: "+err);
    }
} 