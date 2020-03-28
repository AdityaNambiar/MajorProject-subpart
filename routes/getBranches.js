/**
 * Return a list of branches from the current working git repo
 */

const git = require('isomorphic-git');
const router = require('express').Router();
const fs = require('fs');
git.plugins.set('fs',fs); // Bring your own file system 

router.get('/',async (req,res) => {
    try {
        let branches = await git.listBranches({
            dir: '.'
        })
        console.log("branches: ",branches);
        res.status(200).send(branches);
    } catch(e){
        res.send(e);
    }
});

module.exports = router;
