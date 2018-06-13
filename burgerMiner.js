const SHA256 = require('crypto-js/sha256');
const HashProvider = require('./hashProvider');

class BurgerMiner {

  constructor() {
    this.nonce = 0; 
    this.blockHash = '';
    this.timeout = 30000; // in milliseconds
  }

  mineBlock(blockDataHash, difficulty) {
    this.blockDataHash = blockDataHash;
    this.difficulty = difficulty;

    const endTime = new Date().getTime() + this.timeout;
    const target = Array(this.difficulty + 1).join('0');

    while (this.blockHash.substring(0, this.difficulty) !== target) {
      if (new Date().getTime() > endTime) {
        console.log("TIMED OUT: Request new block candidate...");
        return false;
      }
      this.nonce++;
      this.blockHash = this.calculateHash(this.nonce);
      console.log(this.nonce, this.blockHash);
    }

    console.log("BLOCK MINED: " + this.blockHash);

    const currentState = this.resetInstance();

    return ({
      "blockDataHash": currentState.blockDataHash,
      "dateCreated": currentState.dateCreated,
      "nonce": currentState.nonce,
      "blockHash": currentState.blockHash
    })
  }

  /**
   * Reset the instance variables to prepare the miner
   * for the next mining job.
   */
  resetInstance() {
    const values = {};
    Object.assign(values, this);

    this.blockDataHash = '';
    this.nonce = 0;
    this.blockHash = '';
    this.dateCreated = '';
    return values;
  }

  calculateHash(nonce = 0) {
    this.dateCreated = new Date().toISOString();
    const blockData = {
      blockDataHash: this.blockDataHash,
      dateCreated: this.dateCreated,
      nonce: nonce
    }
    return HashProvider.calculateBlockHash(blockData);
  }
}

module.exports = BurgerMiner;