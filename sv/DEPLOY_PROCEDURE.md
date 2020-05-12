# DevOpsChain 
## Integration procedure
1. System will first create a XML schema for the user's job (Sample schema is available under Downloads/pipeline.xml)
2. This will be passed to jenkins.create_job(jobName, xmlString ... );
    - Jenkins will pick up the specified Jenkinsfile and then start a job.
## Deployment procedure.
- After integration is successfully over, system will pick up the Dockerfile of given name and then follow the below steps:  
    1. Build the image (project's image):
         'docker build -t projName:0.1 --no-cache -f Dockerfile.deploy .'
    2. Change the name of the docker image (project's image):
         'docker tag projName:0.1 localhost:7009/projName:0.1'
    3. Push the new docker image (project's image):
         'docker push localhost:7009/projName:0.1'
    4. Remove the local image:
         'docker rmi -f projName:0.1 localhost:5000/projName:0.1'
    5. Pull the proj's image:
         'docker pull localhost:7009/projName:0.1'
    6. Run the image:
         'docker run --rm -P -d -v projName_vol projName:0.1'
    

The port 7009 will be having our own Docker private registry ("registry" docker image).