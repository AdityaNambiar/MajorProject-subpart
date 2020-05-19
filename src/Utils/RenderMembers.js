import React from "react";

const RenderMembers = ({members,collaborators,projectid,addCollaborator,removeCollaborator})=>{

   const  checkDisable = (member)=>{
        const arr =  collaborators.filter((collab)=>collab.pIdentifier==member.pIdentifier)
        if(arr.length==0){
            return false
        }else{
            return true
        }
    }

   
   
  return  members.map((member, index) => (
      
        <div className="input-group mb-3">
          <div className="input-group-prepend ">
            <div className="input-group-text bg bg-dark">
              <button
                type="submit"
                className="btn btn-danger btn-sm "
                name={member.eid}
                disabled={checkDisable(member)}
                onClick={()=>addCollaborator(projectid,member)}
              >
                Add
              </button>
              <button
                type="submit"
                className="btn btn-warning btn-sm ml-2"
                name={member.eid}
                disabled={!checkDisable(member)}
                onClick={()=>removeCollaborator(projectid,member)}
              >
                Remove
              </button>
            </div>
          </div>
          <li
            type="text"
            className="form-control"
            aria-label="Text input with checkbox"
          >
            {member.fname} {member.lname} - {member.designation}
          </li>
        </div>
      ));
}

export default RenderMembers;