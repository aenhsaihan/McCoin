const request = require('request-promise');
const BurgerMiner = require('../burgerMiner');

class MinerProxy {
    constructor(uri, minerAddress) {
        this.uri = uri;
        this.minerAddress = minerAddress;
    }

    async requestBlockCandidate() {
        const resource = this.uri + '/mining/get-mining-job/' + this.minerAddress;
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

        const minerResponse = {
            blockDataHash: blockCandidate.blockDataHash,
            dateCreated: minedBlock.dateCreated,
            nonce: minedBlock.nonce,
            blockHash: minedBlock.hash
        };

        return minerResponse;
    }

    async submitMinedBlock() {
        // TODO: Implementation
    }
}

module.exports = MinerProxy