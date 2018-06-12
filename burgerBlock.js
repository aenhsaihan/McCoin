const HashProvider = require('./hashProvider');

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

        return HashProvider.calculateBlockDataHash(blockData);
    }
}

module.exports = BurgerBlock;
