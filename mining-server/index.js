const MinerProxy = require('./MinerProxy');

/**
 * How to use:
 * 
 * node mining-server/ HOST PORT MINER_PRIVATE_KEY
 * node mining-server/ http://localhost 3001 MINER_PRIVATE_KEY
 */

const host = process.argv[2] || process.env.HOST || "http://localhost";
const port = process.argv[3] || process.env.PORT || 3001;
const minerPrivateKey = process.argv[4] || '5772cf41e652ee4b12128e909ad7a1e4331e909fef043fd251158f58a5982286';
const uri = host + ":" + port;

const minerProxyInstance = new MinerProxy(uri, minerPrivateKey);
 
async function mineForever() {
    try {
        const minedBlock = await minerProxyInstance.mine();
        if (minedBlock) {
            await minerProxyInstance.submitMinedBlock(minedBlock);
        }
    } catch (e) {
        console.log(e.message);
        console.log('Restarting miner...');
    }
    
    setTimeout(() => {
        mineForever();
    }, 1000);
}

mineForever();