const MinerProxy = require('./MinerProxy');

const host = process.argv[2] || process.env.HOST || "http://localhost";
const port = process.argv[3] || process.env.HTTP_PORT || 3001;
const uri = host + ":" + port;

const requester = new MinerProxy(uri, "0x01234567890");

async function mineForever() {
    const minedBlock = await requester.mine();
    if (minedBlock) {
        await requester.submitMinedBlock(minedBlock);
    }
    
    setTimeout(() => {
        mineForever();
    }, 1000);
}

mineForever();