const request = require('request-promise');
const BurgerMiner = require('../burgerMiner');
const BurgerWallet = require('../burgerWallet');

class MinerProxy {
    constructor(uri, minerAddress) {
        this.uri = uri;
        this.minerWallet = new BurgerWallet('5772cf41e652ee4b12128e909ad7a1e4331e909fef043fd251158f58a5982286');
    }

    async requestBlockCandidate() {
        const resource = this.uri + '/mining/get-mining-job/' + this.minerWallet.address;
        console.log(resource);
        const blockCandidate = await request({
            uri: resource,
            json: true
        });
        return blockCandidate;
    }

    async mine() {
        const blockCandidate = await this.requestBlockCandidate();
        const burgerMiner = new BurgerMiner(blockCandidate.blockDataHash, blockCandidate.nonce, blockCandidate.difficulty);
        const minedBlock = await burgerMiner.mineBlock();
        return minedBlock;
    }

    async submitMinedBlock(minedBlock) {
        const options = {
            method: 'POST',
            uri: this.uri + '/mining/submit-mined-block',
            body: minedBlock,
            json: true
        }
        const response = await request(options);
        return response;
    }
}

module.exports = MinerProxy