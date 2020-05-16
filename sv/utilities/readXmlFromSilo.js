
const fs = require('fs');
const mkXmlSilo = require('./mkXmlSilo');
module.exports = function readXmlFromSilo(projName){
    return new Promise( async (resolve, reject) => {
        try {
            let xml_silo_path = await mkXmlSilo();
            fs.readFile(path.resolve(xml_silo_path,`${projName}.xml`), 'utf8' , (err, data) => {
                if (err) reject(new Error('could not read XML'+err))
                resolve(data);
            });
        } catch(err) {
            reject(new Error('(readXmlFromSilo) err '+err));
        }

    })
}

