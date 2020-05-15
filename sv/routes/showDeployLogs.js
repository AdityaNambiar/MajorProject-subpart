const fs = require('fs');

router.get('/showDeployLogs', (req,res) =>{
	try {
		const projName = req.body.projName;

		const logs = fs.readFileSync(projName+'-dockerlogs.txt', 'utf8')

		res.status(200).json({data: logs});
	} catch(err) {
		console.log(err);
		res.status(400).json({data: "Error showing deploy logs "+err});
	}

})