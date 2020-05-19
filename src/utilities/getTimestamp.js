
module.exports.getTimestamp = ()=>{

    let currentDate = new Date();
    let date = currentDate.getDate();
    let month = currentDate.getMonth();
    let year = currentDate.getFullYear();
    let h = currentDate.getHours();
    let m = currentDate.getMinutes();
    let s = currentDate.getSeconds();
    let timestamp =
      date +
      "/" +
      (month + 1) +
      "/" +
      year +
      " - " +
      h +
      ":" +
      m +
      ":" +
      s +
      " IST";
    return timestamp
}
