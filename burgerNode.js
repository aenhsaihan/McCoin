const BurgerBlock = require('./burgerBlock');
const BurgerTransaction = require('./burgerTransaction');
const BurgerMiner = require("./burgerMiner");
const BurgerWallet = require('./burgerWallet');

class BurgerNode {
    constructor(burgerBlockchain) {
        this.chain = burgerBlockchain;
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

    resetChain() {
        this.chain.resetChain();
    }

    validateGenesisBlock(newChain) {
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

      return isGenesisBlockValid;
    }

    replaceChain(newChain) {
      const isChainValid = this.validateChain(newChain);

      if (isChainValid) {
        this.chain = newChain;
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

    validateTransaction(transaction) {
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
        const canPayFee = senderBalance > transaction.fee;
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
        const transactionSuccessfulShouldNotBeTrue = !transaction.transferSuccessful;

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
}

module.exports = BurgerNode;
