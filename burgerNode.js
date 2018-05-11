const BurgerBlock = require('./burgerBlock');

class BurgerNode {
  constructor(burgerBlockchain) {
    this.chain = burgerBlockchain;
    this.pendingTransactions = [];
    this.nodes = [];
  }

  createNewBlock(proof, previousHash, confirmedTransactions = []) {
    const index = this.getLatestBlock().index + 1;
    const timestamp = new Date().toISOString();

    const block = new BurgerBlock(
      index,
      timestamp,
      confirmedTransactions,
      proof,
      previousHash
    );

    this.chain.addBlock(block);
    return block;
  }

  getBlocks() {
    return this.chain.blocks;
  }

  getLatestBlock() {
    return this.chain.blocks[this.chain.blocks.length - 1];
  }

  addNodeToNetwork(address) {
    this.nodes.push(address);
  }

  validateChain() {}
}

module.exports = BurgerNode;
