const {Command, flags} = require('@oclif/command')
const {exec} = require('child_process');
const keytar = require('keytar');
class PushCommand extends Command {
  
  async run() {
    const {flags} = this.parse(PushCommand)
    
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
        this.log("Pushing the repo...");
         await exec(`git push ${url} ${branchname}`, {
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
                 
            });
   

 }
}



PushCommand.description = `
This is Push Command which Pushes your local repo to the remote repo
`

PushCommand.flags = { 
  remote:flags.string({char:'r',description:"Enter the remote"}),
  branchname:flags.string({char: 'b', description: 'Enter Your branch name'}),
  username: flags.string({char: 'u', description: 'Enter Your Username'})
 
 
}

module.exports = PushCommand
