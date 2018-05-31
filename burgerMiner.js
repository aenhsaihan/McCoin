const SHA256 = require('crypto-js/sha256');

class BurgerMiner {

  constructor(blockDataHash, nonce = 0, difficulty = 2) {
    this.blockDataHash = blockDataHash;
    this.nonce = nonce;
    this.hash = '0';
    this.dateCreated = new Date();
    this.difficulty = difficulty
    this.timeout = 30000; // in milliseconds
  }

  mineBlock() {
    const difficulty = this.difficulty;

    const startDate = new Date().getTime();
    const endDate = new Date().getTime() + this.timeout;

    while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join('0')) {
      if (new Date().getTime() > endDate) {
        console.log("TIMED OUT: Request new block candidate...");
        return false;
      }
      this.nonce++;
      this.hash = this.calculateHash(this.nonce);
      console.log(this.nonce, this.hash);
    }

    console.log("BLOCK MINED: " + this.hash);

    return ({
      "blockDataHash": this.blockDataHash,
      "dateCreated": this.dateCreated,
      "nonce": this.nonce,
      "blockHash": this.hash
    })
  }

  calculateHash(nonce = 0) {
    this.dateCreated = new Date().toISOString();
    return SHA256(this.blockDataHash + '|' + this.dateCreated + '|' + nonce).toString();
  }
}

module.exports = BurgerMiner;