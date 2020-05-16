# DevOpsChain 
## Integration procedure
1. System will first create a XML schema for the user's job (Sample schema is available under Downloads/pipeline.xml)
2. This will be passed to jenkins.create_job(jobName, xmlString ... );
    - Jenkins will pick up the specified Jenkinsfile and then start a job.
## Deployment procedure.
- After integration is successfully over, system will pick up the Dockerfile of given name and then follow the below steps:  
    1. Build the image (project's image):
         'docker build -t localhost:7009/projName:0.1 --no-cache -f Dockerfile .'
    3. Push the new docker image (project's image):
         'docker push localhost:7009/projName:0.1'
    4. Remove the local image:
         'docker rmi -f projName:0.1 localhost:5000/projName:0.1'
    5. Pull the proj's image:

        'docker pull localhost:7009/projName:0.1'
    6. Run the image:
         'docker container run --rm -P -d -v projName_vol localhost:7009/projName'
    

The port 7009 will be having our own Docker private registry ("registry" docker image).

command to run private docker registry image:
docker run -d -p 7009:5000 --restart always --name registry -v registrydata:/data registry:2.7.1


-- Currently, I am unable to remove old project images from registry.. It's HTTP DELETE request is working for me.



/* BACKUP FOR REFERENCE (whenever we want to fetch digest of an image -
    As said in the API documentation, you need to pass name and digest with HTTP Method "DELETE" to remove the 
    image from registry but this gives me UNSUPPORTED error.. probably it requires RepoDigest and not .Id):
*/
/*function getImageDigest(projName, tagId){
    return new Promise( (resolve, reject) => {
        try{ 
            const options = {
                method: "GET",
            }

            const req = http.request(`http://${IP}:${registryPort}/v2/${projName}/manifests/${tagId}`, options, (res) => {
                res.on('data', (chunk) => {
                    resolve(JSON.parse(String(chunk)).config.digest); // Return the image digest.
                })
                res.on('error', (error) => {
                    reject(new Error("http resp err: \n",error));
                })
            })
            req.setHeader("Accept","application/vnd.docker.distribution.manifest.v2+json")
            req.on('error', (e) => {
              reject( new Error(`problem with request: ${e.message}`));
            });

            req.end();

        } catch(err) {
            console.log(err);
            reject(new Error('(getImageDigest) err: '+err));
        }
    })
}*/
