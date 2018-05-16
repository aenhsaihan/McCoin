const SHA256 = require('crypto-js/sha256');

class BurgerMiner {

  constructor(candidateBlock, nonce=0) {
    this.candidateBlock = candidateBlock;
    this.nonce = nonce;
    this.hash = '0';
    this.dateCreated = new Date();
  }

  mineBlock() {
    const difficulty = 2;

    while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join('0')) {
      this.nonce++;
      this.hash = this.calculateHash();
      console.log(this.nonce, this.hash);
    }

    console.log("BLOCK MINED: " + this.hash);
  }

  calculateHash(nonce = 0) {

    this.dateCreated = new Date().toISOString();

    return SHA256(this.candidateBlock.blockDataHash + this.dateCreated + nonce).toString();
  }
}

module.exports = BurgerMiner;
