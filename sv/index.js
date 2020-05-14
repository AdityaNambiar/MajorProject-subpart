const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node')
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const docker = require('dockerode');
const app = express();

app.use(bodyParser.json())
app.use(cors())

// app.post('/cloneRepo', require('./routes/cloneRepo'));
app.post('/integrate', require('./routes/integrate'));
app.post('/showLogs', require('./routes/showLogs'));
app.post('/deployDirectly', require('./routes/deployDirectly'));
app.post('/deploy', require('./routes/deploy'));
app.post('/docker-check', require('./routes/docker-check'));
app.listen(5003, () => {
    console.log("listening at 5003");
})