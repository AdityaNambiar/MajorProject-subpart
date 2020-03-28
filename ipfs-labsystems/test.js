// function timeoutPromise (time) {
//     return new Promise(function (resolve) {
//       setTimeout(function () {
//         resolve("hii");
//       }, 5000)
//     })
//   }
  

//   function doSomethingAsync () {
//     return timeoutPromise(1000);
//   }
  
//   async function doAsync () {

//     let promise = await timeoutPromise(545);
//     console.log(promise);
//     // var start = Date.now(), time;
//     // console.log(0);
//     // time = await doSomethingAsync();
//     // console.log(time - start);
//     // time = await doSomethingAsync();
//     // console.log(time - start);
//     // time = await doSomethingAsync();
//     // console.log(time - start);
//   }
  
//   doAsync();
 function performTask(){
  return new Promise((resolve)=>{
    setTimeout(async ()=>{
      resolve("Perfomed Task...")
    },5000)
  })
}

(async function callTask(){
  const result = await performTask();
  console.log(result);
  // performTask().then(result=>console.log(result))
})();