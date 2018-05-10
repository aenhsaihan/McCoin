const SHA256 = require('crypto-js/sha256');

class BurgerBlock {
  constructor(index, transactions, difficulty, prevBlockHash, minedBy) {
    this.index = index; //We will pass the appoppriate index
    this.transactions = transactions;
    this.difficulty = difficulty;
    this.minedBy = minedBy;

    this.nonce = 0;
    this.dataCreated = null;
    this.blockHash = null;
  }

  get blockDataHash() {
    const blockData = {
      index: this.index,
      transactions: this.transactions,
      difficulty: this.difficulty,
      prevBlockhash: this.prevBlockhash,
      minedBy: this.minedBy
    };
    const blockdatahash = SHA256(JSON.stringify(blockData));

    return blockdatahash;
  }
}

module.exports = BurgerBlock;
