const BurgerBlock = require('./burgerBlock');

class BurgerBlockchain {
    constructor(transactions = [], currentDifficulty = 3) {
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
        this.flushPendingTransactions(block);
        this.blocks.push(block);
    }

    flushPendingTransactions(block) {
      const transactions = block.transactions;

      let indexesForRemoval = [];
      for (let i = 0; i < transactions.length; i++) {

        const transaction = transactions[i];

        for (let j = 0; j < this.pendingTransactions.length; j++) {
          const pendingTransaction = this.pendingTransactions[j];

          if (transaction.transactionDataHash === pendingTransaction.transactionDataHash) {
            indexesForRemoval.push(j);
          }
        }
      }

      while (indexesForRemoval.length) {
        const index = indexesForRemoval.shift();

        this.pendingTransactions.splice(index, 1);
      }
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

    canAddBlock(block) {
        const lastBlock = this.getLastBlock();

        if (block.index > lastBlock.index) {
            return true;
        } else {
            return false;
        }
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

        this.createMiningJob(candidateBlock);

        return candidateBlock;
    }
}

module.exports = BurgerBlockchain
