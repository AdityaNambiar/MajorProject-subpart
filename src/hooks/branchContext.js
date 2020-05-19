import React,{useState}from "react"

const BranchContext = React.createContext();


export class BranchProvider extends React.Component{
    state={
        branchname:"master"
    }
    render(){
        return(
            <BranchContext.Provider 
            value={{branchname:this.state.branchname,setBranch:(bname)=>this.setState({branchname:bname})}}>
             {this.props.children}
        </BranchContext.Provider>
        )

    }
}

export default BranchContext;