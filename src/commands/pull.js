const { Command,flags } = require('@oclif/command');
const { exec } = require('child_process');
const keytar = require('keytar');
class PullCommand extends Command {
    async run() { 

    const {flags} = this.parse(PullCommand)
    const remote = flags.remote;
    const branchname = flags.branchname;
    const username = flags.username;
    if(remote ==null || username==null ||branchname==null){
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

        this.log("Pulling the repo...");
        await exec(`git pull ${url} ${branchname}`, {
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
PullCommand.description = `
This is Pull Command which Performs Pulls the remote repo. It performs Fetch + Merge Operations
`

PullCommand.flags = { 
  remote:flags.string({char:'r',description:"Enter the remote"}),
  branchname:flags.string({char: 'b', description: 'Enter Your branch name'}),
  username: flags.string({char: 'u', description: 'Enter Your Username'})
 
 
}

module.exports = PullCommand;
