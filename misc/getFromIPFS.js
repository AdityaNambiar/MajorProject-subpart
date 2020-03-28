export default async function getFromIPFS(majorHash){
    await ipfs.get(majorHash, async (err, results) => {
        if (err) throw new Error("ipfs.get err: \n", err);
        var leader_dirpathhash = results[0].path
        execSync(`ipfs get ${leader_dirpathhash} -o ${projLeader}`, {
            cwd: __dirname,
            shell: true,
        });
    });
}