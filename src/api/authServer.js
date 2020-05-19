const axios = require('axios');

const authServer = axios.create({
    baseURL: 'http://localhost:4000',
    timeout: 20000,
    headers: {'x-auth-token': localStorage.getItem('x-auth-token')}
});



module.exports = authServer;
