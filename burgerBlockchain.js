const BurgerBlock = require('./burgerBlock');

class BurgerBlockchain {
    constructor(pendingTransactions, currentDifficulty = 5) {
        this.blocks = [this.createGenesisBlock()];
        this.pendingTransactions = pendingTransactions;
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
}

module.exports = BurgerBlockchain