const BurgerBlock = require('./burgerBlock');
const BurgerTransaction = require('./burgerTransaction');
const BurgerWallet = require('./burgerWallet');
const BurgerFaucet = require('./burgerFaucet');
const HashProvider = require('./hashProvider');

class BurgerBlockchain {
    constructor(transactions = [], currentDifficulty = 4,blocks = [this.createGenesisBlock()]) {
        this.chainId = blocks[0].blockHash;
        this.blocks = blocks;
        this.pendingTransactions = transactions;
        this.currentDifficulty = currentDifficulty;
        
        this.cumulativeDifficulty = 0;
        this.miningJobs = new Map();
    }

    createGenesisBlock() {
        const genesisBlock = new BurgerBlock(
            0,
            [BurgerFaucet.createFaucetTransaction()],
            0,
            '0000000000000000000000000000000000000000000000000000000000000000',
            '0000000000000000000000000000000000000000'
        );
        genesisBlock.blockHash = this.calculateBlockHash(genesisBlock);
        return genesisBlock;
    }

    addBlock(block) {
        this.flushPendingTransactions(block);
        this.blocks.push(block);
    }

    flushPendingTransactions(block) {
      const transactions = block.transactions;
      
      for (let i = 0; i < transactions.length; i++) {
        for (let j = 0; j < this.pendingTransactions.length; j++) {
          const pendingTransaction = this.pendingTransactions[j];
          if (transactions[i].transactionDataHash === pendingTransaction.transactionDataHash) {
            this.pendingTransactions[j] = 0;
          }
        }
      }
  
      this.pendingTransactions = this.pendingTransactions.filter((transaction) => {
        return transaction !== 0
      });
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

        if (block.index > lastBlock.index && this.isBlockValid(block)) {
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
        blockHash
      } = minedBlock;

      block.nonce = nonce;
      block.dateCreated = dateCreated;
      block.blockHash = blockHash;

      if (this.canAddBlock(block)) {
        this.addBlock(block);
        this.miningJobs.delete(block.blockHash);
        this.cumulativeDifficulty += block.difficulty;
        console.log('Submitted block has been added to chain');
      } else {
        console.log('Submitted block has failed to be added to chain');
      }
    }

    isBlockValid(block) {
      return this.calculateBlockHash(block) === block.blockHash;
    }

    calculateBlockHash(block) {
      return HashProvider.calculateBlockHash(block);
    }

    prepareCandidateBlock(minerAddress) {
      const lastBlock = this.getLastBlock();
      const index = lastBlock.index + 1;

      const transactions = [this.createCoinbaseTransaction(minerAddress)];

      for (let i = 0; i < this.pendingTransactions.length; i++) {
        const transaction = this.pendingTransactions[i];
        const senderBalance = this.getConfirmedBalanceOfAddress(transaction.from);
        const isBalanceEnough = (senderBalance - transaction.value - transaction.fee) >= 0;
        transaction.minedInBlockIndex=index;
        if (isBalanceEnough){
          transaction.transferSuccessful=true;
        } else {
          transaction.transferSuccessful=false;
        }
        transactions[0].value += transaction.fee;
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
        "00000000000000000000000000000000000000000000000000000000000000000",
        [
          "0000000000000000000000000000000000000000000000000000000000000000",
          "0000000000000000000000000000000000000000000000000000000000000000"
        ],
      )
      coinbaseTransaction.transferSuccessful=true;
      coinbaseTransaction.minedInBlockIndex=this.getLastBlock().index+1;
      return coinbaseTransaction;
    }

    getConfirmedBalanceOfAddress(address) {
      const {safeBalance, unsafeBalance} = this.getBalancesForAddress(address);
      const confirmedBalance = safeBalance + unsafeBalance;
      return confirmedBalance;
    }

    getSafeBalanceOfAddress(address) {
      const safeBlockIndex = this.blocks.length - 6;
      return this.getBalanceForAddressUpToBlock(address, safeBlockIndex);
    }

    getConfirmedBalanceOfAddress(address) {
      return this.getBalanceForAddressUpToBlock(address);
    }

    getBalanceForAddressUpToBlock(address, safeBlockIndex = this.blocks.length) {
      let balance = 0;

      this.blocks.forEach(block => {
        if (block.index < safeBlockIndex) {
          balance += this.getBalanceOfTransactions(address, block.transactions);
        }
      });

      return balance;
    }

    getBalanceOfTransactions(address, transactions) {
      let balance = 0;

      transactions.forEach((transaction) => {
        if (transaction.from === address) {
          balance -= transaction.value;
        } else if (transaction.to === address) {
          balance += transaction.value;
        }
      });

      return balance;
    }

    getPendingBalanceOfAddress(address) {
        let debit = 0;
        let credit = 0;
        this.pendingTransactions.forEach((transaction) => {
            if (transaction.from === address) {
                debit += transaction.value;
            }
            if (transaction.to === address) {
                credit += transaction.value;
            }
        });
        const confirmedBalance = this.getConfirmedBalanceOfAddress(address);
        return (confirmedBalance - debit) + credit;
    }
}

module.exports = BurgerBlockchain
