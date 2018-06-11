const SHA256 = require('crypto-js/sha256');

class BurgerBlock {
    constructor(index, transactions, difficulty, prevBlockHash, minedBy) {
        this.index = index; //We will pass the appoppriate index
        this.transactions = transactions;
        this.difficulty = difficulty;
        this.prevBlockhash = prevBlockHash;
        this.minedBy = minedBy;
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
            prevBlockhash: this.prevBlockhash,
            minedBy: this.minedBy
        };
        const blockdatahash = SHA256(JSON.stringify(blockData));

        return blockdatahash.toString();
    }

    static validateBlock(block) {
      const burgerBlockKeys = Object.keys(new BurgerBlock());
      const currentBlockKeys = Object.keys(block);

      const areKeysEqual = JSON.stringify(burgerBlockKeys) === JSON.stringify(currentBlockKeys);

      const isIndexANumber = typeof block.index === 'number';
      const isTransactionsAnArray = Array.isArray(block.transactions);
      const isDifficultyANumber = typeof block.difficulty === 'number';
      const isPrevBlockhashAString = typeof block.prevBlockhash === 'string';
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
