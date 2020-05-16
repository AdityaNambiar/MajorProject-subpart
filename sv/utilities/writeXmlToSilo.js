
const fs = require('fs');
const path = require('path');
const mkXmlSilo = require('./mkXmlSilo');

module.exports = function writeXmlToSilo(projName, newPXML){
    return new Promise( async (resolve, reject) => {
        try {
            let xml_silo_path = await mkXmlSilo();
            fs.writeFile(path.resolve(xml_silo_path,`${projName}.xml`), newPXML, { flags: 'w' }, (err) => {
                if (err) reject(new Error('could not write XML'+err))
                resolve(true);
            });
        } catch(err) {
            reject(new Error('(writeXmlToSilo) err'+err));
        }

    })
}