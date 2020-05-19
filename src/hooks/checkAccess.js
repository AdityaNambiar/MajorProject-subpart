
 module.exports = (project,pIdentifier)=>{

let member = [];
project.collaborators.map((collab)=>{
    member.push(collab.pIdentifier);
})

  member.push(project.creator.split("#").splice(-1)[0]);

  return member.includes(pIdentifier);
}

