class BurgerBlockchain {
  constructor(blocks, pendingTransactions, currentDifficulty = 5) {
    this.blocks = blocks;
    this.pendingTransactions = pendingTransactions;
    this.currentDifficulty = currentDifficulty;

    this.miningJobs = new Map();
  }

  createMiningJob(block) {
    this.miningJobs.set(block.blockDataHash, block);
  }
}
