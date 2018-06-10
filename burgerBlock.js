const SHA256 = require('crypto-js/sha256');

class BurgerBlock {
    constructor(index, transactions, difficulty, prevBlockHash, minedBy) {
        this.index = index; //We will pass the appoppriate index
        this.transactions = transactions;
        this.difficulty = difficulty;
        this.minedBy = minedBy;
        this.prevBlockHash = prevBlockHash;
        this.blockDataHash = this.calculateBlockDataHash();

        this.nonce = 0;
        this.dateCreated = new Date().toISOString();
        this.blockHash = null;
    }

    calculateBlockDataHash() {
        const blockData = {
            index: this.index,
            transactions: this.transactions,
            difficulty: this.difficulty,
            prevBlockHash: this.prevBlockHash,
            minedBy: this.minedBy
        };
        const blockdatahash = SHA256(JSON.stringify(blockData));

        return blockdatahash.toString();
    }
}

module.exports = BurgerBlock;
