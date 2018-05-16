const SHA256 = require('crypto-js/sha256');

class BurgerMiner {

  constructor(blockDataHash, nonce=0,difficulty = 4) {
    this.blockDataHash = blockDataHash;
    this.nonce = nonce;
    this.hash = '0';
    this.dateCreated = new Date();
    this.difficulty = difficulty
  }

  mineBlock() {

    const difficulty = this.difficulty;
    const tempnonce = this.nonce;
    while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join('0')) {
      this.nonce++;
      this.hash = this.calculateHash();
      if(this.nonce > tempnonce+600000){
        return null;
      }
      console.log(this.nonce, this.hash);
    }

    console.log("BLOCK MINED: " + this.hash);
    
    return({"nonce":this.nonce,"hash":this.hash,"dateCreated":this.dateCreated,})
  }

  calculateHash(nonce = 0) {

    this.dateCreated = new Date().toISOString();

    return SHA256(this.blockDataHash + this.dateCreated + nonce).toString();
  }
}

module.exports = BurgerMiner;
