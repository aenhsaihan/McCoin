const MinerProxy = require('./MinerProxy');

const host = process.argv[2];
const port = process.argv[3];
const uri = host + ":" + port;

const requester = new MinerProxy(uri, "0x01234567890");

async function mineForever() {
    const minedBlock = await requester.mine();
    if (minedBlock.blockHash) {
        setTimeout(() => {
            mineForever();
        }, 1000);
    }
}

mineForever();