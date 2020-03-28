const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const createEvidence = require('./routes/createEvidence');
const readEvidence= require("./routes/readEvidence");
const home = require('./routes/home');
const downloadEvidence = require('./routes/downloadEvidence');
const readEvidenceByHash = require('./routes/readEvidenceByHash');
app.use(bodyParser.json())
app.use(cors());
app.use('/createEvidence',createEvidence);
app.use('/readEvidence',readEvidence);
app.use('/',home);
app.use('/downloadEvidence',downloadEvidence);
app.use('/readEvidenceByHash',readEvidenceByHash);
app.get('/api/ipfs',(req,res)=>{
	res.send("ipfs node server connected...");
})
const port = process.env.PORT||5002;
app.listen(port,()=>{console.log(`Listening on port ${port}...`)})
