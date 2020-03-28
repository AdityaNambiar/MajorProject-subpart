import React from 'react';
import ReactDOM from 'react-dom';
let cE = require('../../scripts/createEvidence');
let {createEvidence,getHash} = require('../../scripts/createEvidence')
let filesarr = [];

export default class FirstComp extends React.Component {
    constructor(props){
        super(props);
        
        this.state = {
            buffer: null,
            data: "",
            hash: "",
            files: [],
        }
    }
    
    fileSelectHandle = (e) => {
        const filesArr = e.target.files;
        let files = [] 
        Array.from(filesArr).forEach(file => {
            const filename = file.name;
            const r = new FileReader();
            r.onloadend = () => {
                let fileobj = {
                    path: '/EvidencesDir/'+filename,
                    content: Buffer.from(r.result)
                }
                files.push(fileobj); // Add the other files from a folder or directly 
            }
            r.readAsArrayBuffer(file);
        })
        //console.log("FILE OBJ: ", files);
        this.setState({files});
    }

    uploadToIPFS = async (e) => {
        e.preventDefault();
        const {files, hash} = this.state;
        // +++++ Pass this files object to the createEvidence.js +++++ 
        
        createEvidence(files).then(()=>{
               console.log(getHash());
        })
        this.setState({hash: "QmSjUX1abcXPobMEKZVsPecYLCXgYJ11nFq8pLdWmNLTMU"})
    }
    // Testing single object entry in IPFS
    displayImg = () => {
        const {ipfsHash } = this.state;
        // ipfs.cat(ipfsHash, (err, file) => {
        //     if (err) console.log("ERROR [ IPFS CAT ]\n", err)
            
        //     console.log("NODE DATA [CAT]: ",file);
        //     // For image data:
        //     document.getElementById("result").src = "data:image/png;base64, " + 
        //                 btoa(new Uint8Array(file).reduce((data, byte) => {
        //                     return data + String.fromCharCode(byte);
        //                 },''));
        // })
    } 
    // Testing multiple object entry in IPFS
    displayDoc = () => {
        const { hash } = this.state;
        //rE.readEvidence(hash);
    }
    render() {
        return( 
            <div>
                <input 
                    type="file" 
                    onChange={this.fileSelectHandle}
                />
                <input 
                    type="submit" 
                    value="Upload"
                    onClick={this.uploadToIPFS}
                />
                <img 
                    id="result"
                    onClick = {this.displayImg}
                    src=""
                    style={
                            { 
                                borderSize: '15px', 
                                borderColor: 'black', 
                                borderStyle: 'solid',
                                height: '50vh',
                                width: '75%',
                                marginHorizontal:'50%',
                                marginVertical: '0px'
                            }
                        }>
                      
                </img>
                    <form 
                        encType="multipart/form-data"
                    >
                        <input 
                        type="file" 
                        onChange={this.fileSelectHandle}
                        multiple
                        />
                        <input 
                            type="submit" 
                            value="Upload"
                            onClick={this.uploadToIPFS}
                        />
                    </form>
                    <div 
                        id="docres"
                        onClick = {this.displayDoc}
                        style={
                                { 
                                    borderSize: '15px', 
                                    borderColor: 'black', 
                                    borderStyle: 'solid',
                                    height: '50vh',
                                    width: '75%',
                                    marginHorizontal:'50%',
                                    marginVertical: '0px'
                                }
                            }

                    >    
                    </div>
            </div>
        );
    }
}

export { filesarr }