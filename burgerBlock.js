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

    static createNewInstance(blockData) {
        const burgerBlockInstance = new BurgerBlock();
        Object.assign(burgerBlockInstance, blockData);
        return burgerBlockInstance;
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

    static validateBlock(block) {
      const burgerBlockKeys = Object.keys(new BurgerBlock());
      const currentBlockKeys = Object.keys(block);

      const areKeysEqual = JSON.stringify(burgerBlockKeys) === JSON.stringify(currentBlockKeys);

      const isIndexANumber = typeof block.index === 'number';
      const isTransactionsAnArray = Array.isArray(block.transactions);
      const isDifficultyANumber = typeof block.difficulty === 'number';
      const isPrevBlockhashAString = typeof block.prevBlockHash === 'string';
      // TODO: genesis block minedBy shouldn't default to zero?
      const isMinedByAString = typeof block.minedBy === 'string';
      const isBlockDataHashAString = typeof block.blockDataHash === 'string';
      const isNonceANumber = typeof block.nonce === 'number';
      const isDateCreatedAnObject = typeof block.dateCreated === 'string';
      // TODO: genesis blockhash should not be null
      const isBlockHashAString = typeof block.blockHash === 'string';

      return areKeysEqual
          && isIndexANumber
          && isTransactionsAnArray
          && isDifficultyANumber
          && isPrevBlockhashAString
          && isMinedByAString
          && isBlockDataHashAString
          && isNonceANumber
          && isDateCreatedAnObject
          && isBlockDataHashAString;
    }
}

module.exports = BurgerBlock;
