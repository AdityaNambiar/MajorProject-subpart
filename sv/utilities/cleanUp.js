/**
	Clean up all unused / utagged images and containers made by a project.
	- Still cannot cleanup the private registry.
*/

const Docker = require('dockerode');
const IP = require('ip').address(); // Get machine IP.
//const http = require('http');
const dockerapi = new Docker();
const registryPort = 7009; // Ideally you can set this as process.env or something like this to take in the registry port no. from environment variables.


module.exports = function cleanUp(projName) {
    /**
        To remove all same name containers:
        - docker rm $(docker ps -a | grep reactapp | awk '{ print $1 }')
        To remove all same name images:
        - docker rmi $(docker ps -a | grep reactapp | awk '{ print $3 }')

        But these are NOT RELIABLE. They will also match substrings like for project name with 'react',
        it will also match "reactapp". That is, it will display the super string as well.  
    */
    return new Promise( async (resolve, reject) => {
        try {
            await removeContainer(projName);
            await removeImages(projName);
            return resolve(true); 
        } catch(err) {
            console.log(err);
            return reject(new Error(`(cleanUp) err ${err.name} :- ${err.message}`))
        }
    })
}

function removeImages(projName){
    return new Promise( async (resolve, reject) => {
        try{ 
            const image = await dockerapi.listImages({
                filter: `${IP}:${registryPort}/${projName}`
            });
            if (!image[0]){ // Means no images are present of the same name.
                resolve(true);
            }
            let repoTags = image[0].RepoTags; // Gives an array of tags already present of the same image name.
            let allRepoTags = repoTags.filter(e => e.includes(`${IP}:${registryPort}/`)) // Only consider the registry tagged images.
            // let most_recent_img = allRepoTags[allRepoTags.length - 1] // which among them is the latest
            // let oldRepoTags = allRepoTags.filter(e => e !== most_recent_img)
            for (let i = 0; i < allRepoTags.length; i++) {
                const image = await dockerapi.getImage(allRepoTags[i]);
                console.log("image to be deleted: \n",image.name);
                await image.remove({remove: true}); 
            }
            const imagecheck = await dockerapi.listImages({
                filter: `${IP}:${registryPort}/${projName}`
            });
            console.log("images has been cleaned now: \n", imagecheck);
            return resolve(true);
        } catch(err) {
            console.log(err);
            if (err.message.includes("(HTTP code 404) no such image")){
                return resolve(true);
            }
            return reject(new Error('(removeImages) err: '+err));
        }
    })
}

function removeContainer(projName) {    
    console.log("Removing container ...");
    return new Promise( async (resolve,reject) => {
        try {   
            const container = await dockerapi.getContainer(projName);
            let resp = await container.remove({ force: true, v: true }); // v = remove 'volume' of container as well. 
            console.log("container - if any - has been removed now")
            return resolve(resp);
        } catch(err) {
            console.log(err);
            if (err.message.includes("(HTTP code 404) no such container")){
                return resolve(true);
            } else {
                return reject(new Error(`(removeContainer) err ${err.name} :- ${err.message}`))
            }
        }
    })
}