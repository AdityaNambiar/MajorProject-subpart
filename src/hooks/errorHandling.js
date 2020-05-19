function errorHandling(error){
    if(error.response){
        let er = error.response.data;
        console.log(er)
        if(typeof er=="object"){
            return alert(JSON.stringify(er));
        }else{
            return alert(er)
        }
        
    }else if(error.request){
        return alert(error.request)
    }else{
        return alert(error.message)
    }
    
}

module.exports = errorHandling;