
const fs = require('fs');
module.exports = function mkXmlSilo() {
    return new Promise( (resolve, reject) =>{
        try {
            let xml_silo_path = path.resolve(__dirname,'..','xml_silo');
            if(!fs.existsSync(xml_silo_path)){
                fs.mkdir(xml_silo_path, { recursive: true }, (err) => {
                    if (err) reject(new Error(`mkdir xml silo err: ${err}`));
                    resolve(xml_silo_path);
                })
            }
            resolve(xml_silo_path);
        } catch (err) {
            reject(new Error('mkXmlSilo err: '+err));
        }
    })
}