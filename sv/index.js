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

app.post('/cloneRepo', require('./routes/cloneRepo'));
app.post('/integrateAndDeploy', require('./routes/integrateAndDeploy'));


app.listen(5000, () => {
    console.log("listening at 5000");
})