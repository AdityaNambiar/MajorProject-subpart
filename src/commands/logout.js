const { Command,flags } = require('@oclif/command');
const keytar = require('keytar');
class LogoutCommand extends Command {

        async run(){
        const {flags} = this.parse(LogoutCommand);
        const username = flags.username;
        if(username==null){
            return this.log("Please give the username, check usage, devopschain --help");
          }
            let result = await keytar.deletePassword('tokenService',username);
            if(result){
                this.log(`${username} Logged Out...`);
            }else{
                this.log(`${username} does not exists...`)
            }
        }
}

LogoutCommand.description = `
This is a Logout Command which logout's your cli session.
`

LogoutCommand.flags = { 
  username: flags.string({char: 'u', description: 'Enter Your Username'}) 
 
}

module.exports = LogoutCommand