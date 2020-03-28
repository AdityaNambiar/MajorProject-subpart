/**
 * IPFS JS API:
 * 1. Make your local machine an IPFS node. [ With 'js-ipfs' API ] ~ ipfs init
 * 2. Start the Daemon server.[ With 'ipfsd-ctl' API ] ~cd ipfs daemon
 * 3. Intiailize object of IPFS Client API for actually using it. [ With 'js-ipfs-http-client' API ] 
 *        ~ ipfs add, get, ls etc 
 */ 
const ipfsdaemon = require('ipfsd-ctl');
const IPFS = require('ipfs')
const ipfsClient = require('ipfs-http-client')
/**
async function main () {
    const node = await ipfsBase.create();
    daemon = await daemonobj.spawn({ disposable: true },(err, ipfsd) => {
      if (err) {
        console.log("ERR1: ", err);
      }
  
      ipfsd.api.id(function (err, id) {
        if (err) {
          console.log("ERR2: ", err);
        }
  
        console.log('in-proc-ipfs');
        console.log(id);
      });
    });
    console.log(`NODE: ${node} \n  DAEMON: ${daemon}`);
}
main()
*/
const ipfs = ipfsClient('localhost', '5001',{protocol: 'http'});

async function main () {
  const node = await IPFS.create() // THIS WORKS BUT STILL DOES NOT ALLOW FURTHER THINGS.
}
main()
/*ipfsdaemon
  .create({remote: true, port: 5001})
  .spawn({init: true, disposable: false, repoPath: '/home/playground/.ipfs'},(err, ipfsd) => {
    if (err) {
      console.log("ERR1: ", err);
    }
    ipfsd.api.id(function (err, id) {
      if (err) {
        console.log("ERR2: ", err);
      }

      console.log('in-proc-ipfs')
      console.log(id)
      ipfsd.stop(() => process.exit(0))
    })
  })
*/
export default ipfs;