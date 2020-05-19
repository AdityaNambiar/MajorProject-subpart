const axios = require('axios');

const authServerFile = axios.create({
    baseURL: 'http://localhost:4000',
    // timeout: 1000,
    headers: {
        'x-auth-token': localStorage.getItem('x-auth-token'),
        'Content-Type': 'multipart/form-data'
    
    }
});

module.exports = authServerFile;