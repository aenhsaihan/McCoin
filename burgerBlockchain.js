const SHA256 = require('crypto-js/sha256');

const BurgerBlock = require('./burgerBlock');
const BurgerTransaction = require('./burgerTransaction');
const BurgerWallet = require('./burgerWallet');
const BurgerFaucet = require('./burgerFaucet');

class BurgerBlockchain {
    constructor(transactions = [], currentDifficulty = 4,blocks = [this.createGenesisBlock()]) {
        this.chainId = "0x0";
        this.blocks = blocks;
        this.pendingTransactions = transactions;
        this.currentDifficulty = currentDifficulty;

        this.miningJobs = new Map();
    }

    static createNewInstance(chainData) {
      const burgerBlockchainInstance = new BurgerBlockchain(chainData);
      Object.assign(burgerBlockchainInstance, chainData);
      return burgerBlockchainInstance;
    }

    createGenesisBlock() {
        const genesisBlockData = {
          "index": 0,
          "transactions": [{
            "from": "0000000000000000000000000000000000000000",
            "to": "e9e12fe5c7d3330f83d7a374ca1bacc0cc730196",
            "value": 1000000000000,
            "fee": 0,
            "dateCreated": "2018-06-13T10:01:48.471Z",
            "data": "The first burgers",
            "senderPubKey": "00000000000000000000000000000000000000000000000000000000000000000",
            "senderSignature": [
              "0000000000000000000000000000000000000000000000000000000000000000",
              "0000000000000000000000000000000000000000000000000000000000000000"
            ],
            "minedInBlockIndex": 0,
            "transferSuccessful": true,
            "transactionDataHash": "175f5ee0cd0e93b572729b09853f2cde411a9976abe39236dfbb9c8c7f319d4c"
          }],
          "difficulty": 0,
          "prevBlockhash": "0000000000000000000000000000000000000000000000000000000000000000",
          "minedBy": "0000000000000000000000000000000000000000",
          "prevBlockHash": "0000000000000000000000000000000000000000000000000000000000000000",
          "blockDataHash": "e6c4e5e5a6f880028bddfc0e279c350ffdbd18dff8be2f2bb61cb6e99294a01b",
          "nonce": 0,
          "dateCreated": "2018-06-13T10:01:48.474Z",
          "blockHash": "232e447f6a0a065112b396aaa49cc52b0ff76c37cbd9169635992c207b8f10df"
        }
        
        const genesisBlock = BurgerBlock.createNewInstance(genesisBlockData);
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
        console.log('Submitted block has been added to chain');
      } else {
        console.log('Submitted block has failed to be added to chain');
      }
    }

    isBlockValid(block) {
      return SHA256(block.blockDataHash + '|' + block.dateCreated + '|' + block.nonce).toString() === block.blockHash;
    }

    prepareCandidateBlock(minerAddress) {
      const lastBlock = this.getLastBlock();
      const index = lastBlock.index + 1;

      const transactions = [this.createCoinbaseTransaction(minerAddress)];

      for (let i = 0; i < this.pendingTransactions.length; i++) {
        const transaction = this.pendingTransactions[i];
        transaction.minedInBlockIndex = index;
        transaction.transferSuccessful = this.canSenderTransferTransaction(transaction);
        transactions.push(transaction);
      }

      const candidateBlock = new BurgerBlock(index, transactions, this.currentDifficulty, lastBlock.blockHash, minerAddress);

      this.createMiningJob(candidateBlock);

      return candidateBlock;
    }

    canSenderTransferTransaction(transaction) {
      if (transaction.from === '0000000000000000000000000000000000000000') {
        return true;
      }

      const senderBalance = this.getConfirmedBalanceOfAddress(transaction.from);
      const isBalanceEnough = (senderBalance - transaction.value - transaction.fee) >= 0;
      if (isBalanceEnough){
        return true;
      } else {
        return false;
      }
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

    // getConfirmedBalanceOfAddress(address) {
    //   const {safeBalance, unsafeBalance} = this.getBalancesForAddress(address);
    //   const confirmedBalance = safeBalance + unsafeBalance;
    //   return confirmedBalance;
    // }

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

    calculateCumulativeDifficulty(blocks = this.blocks) {
      let cumulativeDifficulty = 0;

      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];

        cumulativeDifficulty += Math.pow(16, block.difficulty);
      }

      return cumulativeDifficulty;
    }
}

module.exports = BurgerBlockchain
