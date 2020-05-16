
const fs = require('fs');
const path = require('path');
const mkXmlSilo = require('./mkXmlSilo');

module.exports = function writeXmlToSilo(projName, newPXML){
    return new Promise( async (resolve, reject) => {
        try {
            let xml_silo_path = await mkXmlSilo();
            fs.writeFile(path.resolve(xml_silo_path,`${projName}.xml`), newPXML, { flags: 'w' }, (err) => {
                if (err) {
                    console.log(err);
                    return reject(new Error('could not write XML'+err))
                } else {
                    return resolve(true);
                }
            });
        } catch(err) {
            return reject(new Error('(writeXmlToSilo) err'+err));
        }

    })
}