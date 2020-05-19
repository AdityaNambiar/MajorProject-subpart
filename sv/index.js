const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node')
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const docker = require('dockerode');
const app = express();

app.use(bodyParser.json())
app.use(cors());

app.use('/deploy', require('./routes/deploy'));
//app.use('/showLogs', require('./routes/showLogs'));
app.use('/getDeployURL', require('./routes/getDeployURL'));
app.use('/deployDirectly', require('./routes/deployDirectly'));
//app.use('/showDeployLogs', require('./routes/showDeployLogs'));
app.use('/integrate', require('./routes/integrate'));

app.listen(5003, () => {
    console.log("listening at 5003");
})