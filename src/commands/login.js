const {Command, flags} = require('@oclif/command')
const fs = require('fs');
const request = require('request');
const keytar  = require('keytar');
const jwt = require("jsonwebtoken");
class LoginCommand extends Command{
    
    async run(){
      
        const {flags} = this.parse(LoginCommand);
        const filepath = flags.path;
        let loginUrl = "http://localhost:4000/bnUtil/login"
        if(filepath===undefined){
          return this.log('Please enter the card path, check usage, devopschain --help')
        }
      try{
        
        var r = request.post(loginUrl, async function optionalCallback (err, httpResponse, body) {
              if (err) {
                return console.error('upload failed:', err);
              }
              let response = JSON.parse(body);
              let token = response.acessToken;
              let username = jwt.decode(token).pIdentifier
              await keytar.setPassword('tokenService',username,token);
             console.log(`Login Successful with Username ${username}`)
                });
       
            var form = r.form();
            form.append('card', fs.createReadStream(filepath));

    }catch(error){
      this.log(error)
  } 

} 
}

LoginCommand.description = `
This is a Login Command which login's you to the remote repo
`

LoginCommand.flags = { 
  path: flags.string({char: 'f', description: 'Path of your Card file'})
}

module.exports = LoginCommand
