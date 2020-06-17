const keytar = require('keytar');
const axios = require('axios');
let authServer = "http://localhost:4000/checkAccess";
async function checkAccess(username,projectid,operation){
   
    const token = await keytar.getPassword("tokenService",username);
    if(token==null){
        return console.log('Please login using your card or check the username');
       
      }
      
    try{
      let configuration = {
        headers:{
          'x-auth-token':token
        } 
      }
      const response = await axios.post(authServer,{"operation":operation,"projectid":projectid},configuration);
       let accessobj = response.data;
       return accessobj.access;
    }catch(error){
      console.log("Please login...")
    }   
}

module.exports = checkAccess;