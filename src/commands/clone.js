const { Command,flags } = require('@oclif/command');
const { exec } = require('child_process');
const keytar = require('keytar');


class Clone extends Command {
    async run() { 
        const {flags} = this.parse(Clone)
        const remote = flags.remote;
        const username = flags.username;
        if(remote ==null || username==null){
            return this.log("Parameters missing, please check usage, devopschain --help");
        }
        let token = null;
        try{
            token = await keytar.getPassword("tokenService",username);
        }catch(error){
            return this.log("Please login using your card...");
        }
 
        if(token==null || token==undefined){
            return this.log('Please login using your card or check the username');
        }

                let refineremote = remote.split("http://")[1];
                let url = `http://${username}:${token}@${refineremote}`;
                this.log("Cloning the repo...");
                await exec(`git clone ${url}`, {
                    cwd: `.`,
                    shell: true
                }, (err, stdout, stderr) => {
                    if (err){
                        // console.log(err);
                    } 
                    if (stderr) {
                        console.log(stderr);
                    }
                   
                    // console.log(stdout);
                })
       
    }
}

Clone.description = `
This is Clone Command which Clones the remote repo`


Clone.flags = { 
  remote:flags.string({char:'r',description:"Enter the remote"}),
  username: flags.string({char: 'u', description: 'Enter Your Username'})
 
 
}

module.exports = Clone;