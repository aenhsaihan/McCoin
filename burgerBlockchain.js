const BurgerBlock = require('./burgerBlock');
const BurgerTransaction = require('./burgerTransaction');
const BurgerWallet = require('./burgerWallet');

class BurgerBlockchain {
    constructor(transactions = [], currentDifficulty = 3,blocks = [this.createGenesisBlock()]) {
        this.chainId = "0x0";
        this.blocks = blocks;
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

    addMinedBlock(minedBlock) {
      let block = this.miningJobs.get(minedBlock.blockDataHash);

      const {
        nonce,
        dateCreated,
        hash
      } = minedBlock;

      block.nonce = nonce;
      block.dateCreated = dateCreated;
      block.blockHash = hash;

      if (this.canAddBlock(block)) {
        this.addBlock(block);
        this.miningJobs.delete(block.blockHash);
        console.log('Submitted block has been added to chain');
      } else {
        console.log('Submitted block has failed to be added to chain');
      }
    }

    prepareCandidateBlock(minerAddress) {
        const lastBlock = this.getLastBlock();
        const index = lastBlock.index + 1;
        
        const transactions = [this.createCoinbaseTransaction(minerAddress)];

        for (let i = 0; i < this.pendingTransactions.length; i++) {
            const transaction = this.pendingTransactions[i];
            // TODO: Implementation
            transaction.minedInBlockIndex=index;
            if(BurgerWallet.verify(transaction)){
                transaction.transferSuccessful=true;
            }else{
                transaction.transferSuccessful=false; 
            }
        
            transactions.push(transaction);
        }

        const candidateBlock = new BurgerBlock(index, transactions, this.currentDifficulty, lastBlock.blockHash, minerAddress);

        this.createMiningJob(candidateBlock);

        return candidateBlock;
    }

    createCoinbaseTransaction(coinbaseAddress) {

      const coinbaseTransaction = new BurgerTransaction(
        "0000000000000000000000000000000000000000",
        coinbaseAddress,
        500000,
        0,
        new Date().toISOString(),
        'coinbase tx',
        "0000000000000000000000000000000000000000",
        ["0000000000000000000000000000000000000000",
        "0000000000000000000000000000000000000000"]
      )
      coinbaseTransaction.transferSuccessful=true;
      coinbaseTransaction.minedInBlockIndex=this.getLastBlock().index+1;
      return coinbaseTransaction;
    }
}

module.exports = BurgerBlockchain
