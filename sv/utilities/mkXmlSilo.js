
const fs = require('fs');
const path = require('path')
module.exports = function mkXmlSilo() {
    return new Promise( (resolve, reject) =>{
        try {
            let xml_silo_path = path.resolve(__dirname,'..','xml_silo');
            if(!fs.existsSync(xml_silo_path)){
                fs.mkdir(xml_silo_path, { recursive: true }, (err) => {
                    if (err){ 
                        return reject(new Error(`mkdir xml silo err: ${err}`));
                    } else {
                        return resolve(xml_silo_path);
                    }
                })
            } else {
                return resolve(xml_silo_path);
            }
        } catch (err) {
            console.log(err);
            return reject(new Error('mkXmlSilo err: '+err));
        }
    })
}