const request = require('request-promise');
const BurgerMiner = require('../burgerMiner');
const BurgerWallet = require('../burgerWallet');

class MinerProxy {
    constructor(uri, minerPrivateKey) {
        this.uri = uri;
        this.minerWallet = new BurgerWallet(minerPrivateKey);
        this.burgerMiner = new BurgerMiner();
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
        const minedBlock = await this.burgerMiner.mineBlock(blockCandidate.blockDataHash, blockCandidate.difficulty);
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