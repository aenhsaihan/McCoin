const MinerProxy = require('./MinerProxy');

const host = process.argv[2] || process.env.HOST || "http://localhost";
const port = process.argv[3] || process.env.HTTP_PORT || 3001;
const uri = host + ":" + port;

const minerProxyInstance = new MinerProxy(uri, "5772cf41e652ee4b12128e909ad7a1e4331e909fef043fd251158f58a5982286");
 
async function mineForever() {
    const minedBlock = await minerProxyInstance.mine();
    if (minedBlock) {
        await minerProxyInstance.submitMinedBlock(minedBlock);
    }
    
    setTimeout(() => {
        mineForever();
    }, 1000);
}

mineForever();