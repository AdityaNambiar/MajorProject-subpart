const axios = require('axios');

module.exports = function(){
    return new Promise((resolve,reject)=>{

        let token = window.localStorage.getItem("x-auth-token")
   resolve(axios.create({
        baseURL: 'http://localhost:4000',
        timeout: 20000,
        headers: {'x-auth-token': token}
    }))

    })
    
}