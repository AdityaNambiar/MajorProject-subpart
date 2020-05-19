import React from "react"
// This function takes a component...

export default function withSubscription(WrappedComponent,) {
    // ...and returns another component...
    return class extends React.Component {
      constructor(props) {
        super(props);
        this.changeBranch = this.changeBranch.bind(this);
        this.state = {
          branchname:"master"
        };
      }
      changeBranch = (bname)=>{
          console.log("Entered Hoc with branch:"+bname)
         this.setState({branchname:bname})
      }
      render() {
        
        return <WrappedComponent branchname={this.state.branchname} changeBranch={(bname)=>this.changeBranch(bname)} {...this.props} />;
      }
    };
  }