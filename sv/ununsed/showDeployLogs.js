const fs = require('fs');
const router = require('express').Router();

router.post('/', (req,res) =>{
	try {
		const projName = req.body.projName;

		const logs = fs.readFileSync(projName+'-dockerlogs.txt', 'utf8')

		res.status(200).json({logs: logs});
	} catch(err) {
		console.log(err);
		res.status(400).json({err: "Error showing deploy logs "+err});
	}

})

module.exports = router;