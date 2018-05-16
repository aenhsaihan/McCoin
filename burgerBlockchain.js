const BurgerBlock = require('./burgerBlock');

class BurgerBlockchain {
    constructor(transactions = [], currentDifficulty = 5) {
        this.chainId = "0x0";
        this.blocks = [this.createGenesisBlock()];
        this.pendingTransactions = transactions;
        this.currentDifficulty = currentDifficulty;

        this.miningJobs = new Map();
    }

    createGenesisBlock() {
        const genesisBlock = new BurgerBlock(
            0,
            0,
            0,
            '816534932c2b7154836da6afc367695e6337db8a921823784c14378abed4f7d7',
            0
        );
        return genesisBlock;
    }

    addBlock(block) {
        this.blocks.push(block);
    }

    createMiningJob(block) {
        this.miningJobs.set(block.blockDataHash, block);
    }

    resetChain() {
        this.blocks = [this.createGenesisBlock()];
    }

    getLastBlock() {
        return this.blocks[this.blocks.length - 1];
    }

    prepareCandidateBlock(minerAddress) {
        const lastBlock = this.getLastBlock();
        const index = lastBlock.index + 1;

        const transactions = [];

        for (let index = 0; index < this.pendingTransactions.length; index++) {
            const transaction = this.pendingTransactions[index];
            // TODO: Implementation
            // if (valid) {
            //      transactions.push(transaction)
            // }

            transactions.push(transaction);
        }

        const candidateBlock = new BurgerBlock(index, transactions, this.currentDifficulty, lastBlock.blockHash, minerAddress);
        return candidateBlock;
    }
}

module.exports = BurgerBlockchain