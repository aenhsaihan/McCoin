const BurgerBlock = require('./burgerBlock');
const BurgerTransaction = require('./burgerTransaction');
const BurgerBlockchain = require('./burgerBlockchain');
const BurgerWallet = require('./burgerWallet');
const uuidv4 = require('uuid/v4');
 
class BurgerNode {
    constructor(burgerBlockchain, configurations) {
        this.chain = burgerBlockchain;
        this.nodes = {};

        this.nodeId = uuidv4();
        this.nodeUrl = configurations.selfUrl;
    }

    get info() {
        return {
            "about": "McCoinChain/v0.1",
            "nodeId": this.nodeId,
            "chainId": this.chain.chainId,
            "nodeUrl": this.nodeUrl,
            "peers": Object.keys(this.nodes).length,
            "currentDifficulty": this.chain.currentDifficulty,
            "blocksCount": this.chain.blocks.length,
            "cumulativeDifficulty": this.chain.cumulativeDifficulty,
            "confirmedTransactions": this.pullConfirmedTransactions().length,
            "pendingTransactions": this.chain.pendingTransactions.length
        }
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

    resetChain() {
        this.chain.resetChain();
    }

    appendPendingTransactions(pendingTransactions) {
        pendingTransactions.forEach((transaction) => {
            this.addPendingTransaction(transaction);
        })
    }

    validateTransactionsOfBlock(block) {
      let areTransactionsValid = true;
      for (let i = 1; i < block.transactions.length; i++) {
        const newTransaction = block.transactions[i];
        const isTransactionValid = this.validateTransaction(newTransaction, block);
        const isMinedInCorrectBlockIndex = newTransaction.minedInBlockIndex === block.index;
        const isTransferSuccessful = newTransaction.transferSuccessful === this.chain.canSenderTransferTransaction(newTransaction);

        if (!isTransactionValid && !isMinedInCorrectBlockIndex && !isTransferSuccessful) {
          areTransactionsValid = false;
          break;
        }
      }

      return areTransactionsValid;
    }

    validateBlocks(newChain) {
      // [Anar] maybe this logic should go in the chain?
      let areBlocksValid = true;

      for (var i = 1; i < newChain.blocks.length; i++) {
        const newBlock = newChain.blocks[i]
        // newBlock.prevBlockhash = "somestring"; // just for testing purposes!!!
        const areBlockKeysAndValuesValid = BurgerBlock.validateBlock(newBlock); // just validating keys/values

        // re-calculate block data hash
        const compareBlock = new BurgerBlock(
          newBlock.index,
          newBlock.transactions,
          newBlock.difficulty,
          newBlock.prevBlockhash,
          newBlock.minedBy
        );
        const doBlockDataHashesMatch = newBlock.blockDataHash === compareBlock.blockDataHash;

        // re-calculate block hash
        const doBlockHashesMatch = this.chain.isBlockValid(newBlock);

        // corroborate hash's difficulty
        const currentDifficulty = newBlock.difficulty;
        const isDifficultyValid = newBlock.blockHash.substring(0, currentDifficulty) === Array(currentDifficulty + 1).join('0');

        // corroborate the previousHash value of the previous block
        const previousBlock = newChain.blocks[i - 1];
        const isPrevBlockHashValid = newBlock.prevBlockhash === previousBlock.blockHash;

        if (!areBlockKeysAndValuesValid
          || !doBlockDataHashesMatch
          || !doBlockHashesMatch
          || !isDifficultyValid
          || !isPrevBlockHashValid
        ) {
          areBlocksValid = false;
          break;
        }

        let areTransactionsValid = this.validateTransactionsOfBlock(newBlock);

        if (!areTransactionsValid) {
          areBlocksValid = false;
          break;
        }
      }

      return areBlocksValid;
    }

    validateGenesisBlock(newChain) {
      // [Anar] maybe this logic should go in the chain?
      const genesisBlockHeld = this.chain.blocks[0].transactions[0];
      const genesisBlockHeldKeys = Object.keys(genesisBlockHeld);
      const genesisBlockHeldValues = Object.values(genesisBlockHeld);

      const receivedGenesisBlock = newChain.blocks[0].transactions[0];
      const receivedGenesisBlockKeys = Object.keys(receivedGenesisBlock);
      const receivedGenesisBlockValues = Object.values(receivedGenesisBlock);

      const areKeysEqual = JSON.stringify(genesisBlockHeldKeys) === JSON.stringify(receivedGenesisBlockKeys);
      const areValuesEqual = JSON.stringify(genesisBlockHeldValues) === JSON.stringify(receivedGenesisBlockValues);

      return areKeysEqual && areValuesEqual;
    }

    validateChain(newChain) {
      const isGenesisBlockValid = this.validateGenesisBlock(newChain);
      const areBlocksValid = this.validateBlocks(newChain);

      return isGenesisBlockValid
          && areBlocksValid;
    }

    replaceChain(newChain) {
      const isChainValid = this.validateChain(newChain);
      const newChainInstance = BurgerBlockchain.createNewInstance(newChain);
      const pendingTransactions = this.chain.pendingTransactions;

      const hasMoreCumulativeDifficulty = newChainInstance.calculateCumulativeDifficulty() > this.chain.calculateCumulativeDifficulty();

      if (isChainValid && hasMoreCumulativeDifficulty) {
        // [Anar] TODO: clear mining jobs if cumulativeDifficulty is higher than current chain
        this.chain = newChainInstance;
        this.appendPendingTransactions(pendingTransactions);
      } else {
        console.log('Received chain is not valid, rejecting...');
      }
    }

    getBlocks() {
        return this.chain.blocks;
    }

    getLatestBlock() {
        return this.chain.blocks[this.chain.blocks.length - 1];
    }

    findBlockByIndex(index) {
        const blocks = this.getBlocks()
        const blockAtIndex = blocks.filter(block => block.index === parseInt(index))
        return blockAtIndex
    }

    addNodeToNetwork(node) {
        this.nodes.push(node);
    }

    addPendingTransaction(transaction) {
        const {
            from,
            to,
            value,
            fee,
            dateCreated,
            data,
            senderPubKey,
            senderSignature,
        } = transaction;

        const burgerTransaction = new BurgerTransaction(from, to, value, fee, dateCreated, data, senderPubKey, senderSignature);

        if (this.validateTransaction(burgerTransaction)) {
            this.chain.pendingTransactions.push(burgerTransaction);
            return true;
        }

        return false;
    }

    addMinedBlock(minedBlock) {
        this.chain.addMinedBlock(minedBlock);
    }

    getPendingBalanceOfAddress(address) {
      const pendingBalance = this.chain.getPendingBalanceOfAddress(address);
      return pendingBalance;
    }

    getConfirmedBalanceOfAddress(address) {
      return this.chain.getConfirmedBalanceOfAddress(address);
    }

    getSafeBalanceOfAddress(address) {
      return this.chain.getSafeBalanceOfAddress(address);
    }

    validateTransaction(transaction, block) {
        const validKeys = [
            'from',
            'to',
            'value',
            'fee',
            'dateCreated',
            'data',
            'senderPubKey',
            'senderSignature',
            'minedInBlockIndex',
            'transferSuccessful',
            'transactionDataHash'
        ];
        const senderBalance = this.getConfirmedBalanceOfAddress(transaction.from);
        const receiverBalance = this.getConfirmedBalanceOfAddress(transaction.to);
        const objectKeys = Object.keys(transaction);
        const minimumFee = 10;

        const areKeysEqual = JSON.stringify(validKeys) === JSON.stringify(objectKeys);
        let canPayFee = senderBalance > transaction.fee;
        const willNotOverflow = (receiverBalance + transaction.value) >= receiverBalance;
        const isValueGreaterThanOrEqualToZero = transaction.value >= 0;
        const isSenderCorrect = this.validateAddress(transaction.from);
        const isReceiverCorrect = this.validateAddress(transaction.to);
        const isSignatureValid = BurgerWallet.verify(transaction);
        const isFeeGreaterThanEqualToMinimum = transaction.fee >= minimumFee;

        const expectedTransactionDataHash = BurgerTransaction.computetransactionDataHash(transaction);
        const isTransactionDataHashValid = expectedTransactionDataHash === transaction.transactionDataHash;

        const transactionDataHashMustBeUnique = this.chain.pendingTransactions.filter(tx => tx.transactionDataHash === transaction.transactionDataHash).length === 0;
        const isValidTransactionDataHash = transaction.transactionDataHash === BurgerTransaction.computetransactionDataHash(transaction);
        const areNumbersOfCorrectType = typeof transaction.fee === 'number' && typeof transaction.value === 'number';
        let transactionSuccessfulShouldNotBeTrue = !transaction.transferSuccessful; // make it let for now

        if (block) {
          // replay transactionSuccessful here using logic from the burgerChain prepare candidate block
          transactionSuccessfulShouldNotBeTrue = true;
        }

        if (transaction.from === '0000000000000000000000000000000000000000') {
            canPayFee = true;
            isSignatureValid = true;
        }

        return areKeysEqual
            && canPayFee
            && willNotOverflow
            && isValueGreaterThanOrEqualToZero
            && isSenderCorrect
            && isReceiverCorrect
            && isSignatureValid
            && isFeeGreaterThanEqualToMinimum
            && isTransactionDataHashValid
            && transactionDataHashMustBeUnique
            && isValidTransactionDataHash
            && areNumbersOfCorrectType
            && transactionSuccessfulShouldNotBeTrue
    }

    validateAddress(address) {
        return address.length === 40;
    }

    getTransactionsOfAddress(address) {
        let transactions = [];

        // Use length-caching for-loop for optimization
        for (let index = 0, blockHeight = this.chain.blocks.length; index < blockHeight; index++) {
            const blockTransaction = this.chain.blocks[index].transactions.filter((transaction) => {
                return transaction.to === address || transaction.from === address;
            });
            if (blockTransaction.length > 0) {
                transactions = transactions.concat(transactions, blockTransaction);
            }
        }

        return transactions;
    }

    getTransaction(transactionDataHash) {
        let transactionData = {};
        for (let index = 0, blockHeight = this.chain.blocks.length; index < blockHeight; index++) {
            const tx = this.chain.blocks[index].transactions.find(transaction => transaction.transactionDataHash === transactionDataHash);
            if (tx) {
                transactionData = tx;
                break;
            }
        }
        return transactionData;
    }

    pullConfirmedTransactions() {
        let confirmedTransactions = [];
        this.chain.blocks.forEach(block => {
            confirmedTransactions = confirmedTransactions.concat(block.transactions);
        });
        
        return confirmedTransactions;
    };


}

module.exports = BurgerNode;
