
  module.exports = function downloadCard(res,pIdentifier){
    try{
        // let defaultFilename = `${pIdentifier}@devopschain.card`
        let defaultFilename = pIdentifier

        var data = new Blob([res.data]);
        if (typeof window.navigator.msSaveBlob === 'function') {
          // If it is IE that support download blob directly.
          window.navigator.msSaveBlob(data, defaultFilename);
        } else {
          var blob = data;
          var link = document.createElement('a'); 
          link.href = window.URL.createObjectURL(blob);
          link.download = defaultFilename;
          document.body.appendChild(link);

          link.click(); // create an <a> element and simulate the click operation.
        }
        

    }catch(error){
        var reader = new FileReader();
        reader.onload = function() {
            alert(reader.result);
        }
        reader.readAsText(error.response.data);
        alert(error.response.data);
        
        // this.setState({loading:false})
    }

  }
       
        
