const path = require('path');
const express = require('express');
const router = express.Router();
const Docker = require('dockerode');
const IP = require('ip').address(); // Get machine IP.
//const http = require('http');
const dockerapi = new Docker();
const registryPort = 7009; // Ideally you can set this as process.env or something like this to take in the registry port no. from environment variables.


// Utility imports:

const cleanUp = require('../utilities/cleanUp');

router.post('/', async (req, res) => {

    try {
    const projName = req.body.projName;
    const branchName = req.body.branchToUpdate;
    const containerName = `${projName}-${branchName}`;
    const container = await dockerapi.getContainer(containerName);
    //console.log(container);
    var ports = [], urls = [], containerPort = "";
    await container.inspect((err, data) => {
        if (err) {
            res.write(`${err.name} :- ${err.message}`);
            res.write("\nYou will need to deploy your application again")
            return res.status(400).send();
        }
        var portBindings = data.NetworkSettings.Ports;
        //console.log("pbings: \n",portBindings);
        for (let pb in portBindings){
            containerPort = pb;
            ports.push(portBindings[pb][0].HostPort);
        }
        console.log("ports: \n", ports);
        for (let p in ports){
            urls.push(`http://${IP}:${ports[p]} (${containerPort})`);
        }
        console.log("urls: \n", urls);
        return res.status(200).send({urls: urls});
    })
    } catch (err) {
        console.log(err);
        return res.status(400).send({err:`(getDeployURL) main err ${err.name} :- ${err.message}`});
    }
})

module.exports = router