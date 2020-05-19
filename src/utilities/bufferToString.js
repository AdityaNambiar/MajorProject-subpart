module.exports = (arrbuff)=>{
    let filecontent = "";
      let size = 1024;
      let i = 0;
        // for(var i=0;i<arrbuff.length;i+=size){
        //     filecontent+= String.fromCharCode.apply(null,new Uint8Array(arrbuff.splice(i,i+size)))
        // }
        arrbuff.map((arr)=>{
            filecontent+= String.fromCharCode.apply(null,new Uint8Array(arrbuff.splice(i,i+size)));
            i = i +1
        })
    return filecontent;
}