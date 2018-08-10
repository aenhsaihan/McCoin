const BurgerBlock = require('./burgerBlock');
const BurgerTransaction = require('./burgerTransaction');
const BurgerBlockchain = require('./burgerBlockchain');
const BurgerWallet = require('./burgerWallet');
const uuidv4 = require('uuid/v4');
const bnJs = require("bn.js");

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
            "latestBlockHash": this.getLatestBlock().blockHash,
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
        let allPendingTransactions = pendingTransactions;

        if (pendingTransactions.length == 0 && this.chain.pendingTransactions.length == 0) {
            /**
             * Nothing to do here!
             */
            return this.chain.pendingTransactions;
        }

        if (this.chain.pendingTransactions.length > 0 && pendingTransactions.length > 0) {
            /**
             * Append operation between incoming pending transactions and own pending transactions
             */
            for (let currentPendingIndex = 0; currentPendingIndex < this.chain.pendingTransactions.length; currentPendingIndex++) {
                const transaction = this.chain.pendingTransactions[currentPendingIndex];
                for (let allPendingIndex = 0; allPendingIndex < allPendingTransactions.length; allPendingIndex++) {
                    if (JSON.stringify(transaction) === JSON.stringify(allPendingTransactions[allPendingIndex])) {
                        allPendingTransactions[allPendingIndex] = 0;
                    }
                }
            }

            allPendingTransactions = allPendingTransactions.filter((transactions) => {
                return transactions !== 0;
            });
        }

        if (pendingTransactions.length > 0 && this.chain.pendingTransactions.length === 0) {
            /**
             * Sync the incoming pending transactions.
             */
            allPendingTransactions = pendingTransactions;
        }

        if (pendingTransactions.length === 0 && this.chain.pendingTransactions.length > 0) {
            /**
             * Nothing to append!
             */
            return this.chain.pendingTransactions;
        }

        /**
         * Clear the current pending transactions to
         * prepare it for the appended one.
         */
        this.chain.pendingTransactions = [];

        allPendingTransactions.forEach((transaction) => {
            this.addPendingTransaction(transaction);
        });

        this.cleanPendingTransactions(this.chain.pendingTransactions);

        return this.chain.pendingTransactions;
    }

    cleanPendingTransactions(pendingTransactionsData) {
        let pendingTransactions = pendingTransactionsData;

        for (let index = 0; index < this.pullConfirmedTransactions().length; index++) {
            const transaction = this.pullConfirmedTransactions()[index];
            for (let pendingIndex = 0; pendingIndex < pendingTransactions.length; pendingIndex++) {
                if (transaction.transactionDataHash === pendingTransactions[pendingIndex].transactionDataHash) {
                    pendingTransactions[pendingIndex] = 0;
                }
            }
        }

        pendingTransactions = pendingTransactions.filter((transaction) => {
            return transaction !== 0;
        });

        this.chain.pendingTransactions = pendingTransactions;
        return this.chain.pendingTransactions;
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

            // just validating keys/values
            const areBlockKeysAndValuesValid = BurgerBlock.validateBlock(newBlock);

            // re-calculate block data hash
            const compareBlock = new BurgerBlock(
                newBlock.index,
                newBlock.transactions,
                newBlock.difficulty,
                newBlock.prevBlockHash,
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
            const isPrevBlockHashValid = newBlock.prevBlockHash === previousBlock.blockHash;

            if (!areBlockKeysAndValuesValid ||
                !doBlockDataHashesMatch ||
                !doBlockHashesMatch ||
                !isDifficultyValid ||
                !isPrevBlockHashValid
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

        return isGenesisBlockValid &&
            areBlocksValid;
    }

    decideSync(ownCumulativeDifficulty, peerCumulativeDifficulty, ownBlockHash, peerBlockHash) {
        const ownBlockHashValue = new bnJs(ownBlockHash, 16);
        const peerBlockHashValue = new bnJs(peerBlockHash, 16);

        if (ownCumulativeDifficulty === peerCumulativeDifficulty && ownBlockHashValue.lt(peerBlockHashValue)) {
            return true;
        }

        if (ownCumulativeDifficulty < peerCumulativeDifficulty) {
            return true;
        }

        return false;
    }

    replaceChain(newChain) {
        const isChainValid = this.validateChain(newChain);
        const newChainInstance = BurgerBlockchain.createNewInstance(newChain);

        const miningJobs = this.chain.miningJobs

        const newChainCumulativeDifficulty = newChainInstance.calculateCumulativeDifficulty();
        const currentChainCumulativeDifficulty = this.chain.calculateCumulativeDifficulty();

        const ownBlockHash = this.getLatestBlock().blockHash;
        const peerBlockHash = newChainInstance.blocks[newChainInstance.blocks.length - 1].blockHash;

        const willSync = this.decideSync(
            currentChainCumulativeDifficulty, 
            newChainCumulativeDifficulty, 
            ownBlockHash, 
            peerBlockHash
        );

        if (isChainValid && willSync) {
            const pendingTransactions = this.chain.pendingTransactions;
            this.chain = newChainInstance;
            this.appendPendingTransactions(pendingTransactions);
            this.chain.miningJobs = miningJobs;
            this.chain.clearMiningJobsBeforeBlockIndex(this.chain.currentDifficulty);
            console.log('SUCCESS: Received chain accepted!');
            return true;
        } else {
            if (!isChainValid) {
                console.log('REJECTED! Received chain is not valid!');
                return false;
            }

            if (ownBlockHashValue.gte(peerBlockHashValue)) {
                console.log('Peer block hash is lesser, allowing peer to sync...');
                return false;
            }

            if (newChainCumulativeDifficulty === currentChainCumulativeDifficulty) {
                console.log('Chain difficulties are equal! Got nothing to do...');
                return false;
            }
            return false;
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
        const blockAtIndex = blocks.find(block => block.index === parseInt(index))
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

        let burgerTransaction;
        let isValid;

        burgerTransaction = new BurgerTransaction(from, to, value, fee, dateCreated, data, senderPubKey, senderSignature);
        isValid = this.validateTransaction(burgerTransaction);

        if (isValid) {
            this.chain.pendingTransactions.push(burgerTransaction);
            console.log('Transaction ' + burgerTransaction.transactionDataHash + ' accepted!')
            return true;
        } else {
            console.log('Transaction ' + burgerTransaction.transactionDataHash + ' failed!');
            return false;
        }
    }

    appendBlock(block) {
      return this.chain.appendBlock(block);
    }

    addMinedBlock(minedBlock) {
        return this.chain.addMinedBlock(minedBlock);
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
        if (!areKeysEqual) {
            throw new Error('Invalid transaction format');
        }

        const expectedTransactionDataHash = BurgerTransaction.computetransactionDataHash(transaction);
        const isTransactionDataHashValid = expectedTransactionDataHash === transaction.transactionDataHash;
        if (!isTransactionDataHashValid) {
            throw new Error('Invalid transaction data hash');
        }

        transaction.fee = parseInt(transaction.fee);
        transaction.value = parseInt(transaction.value);

        const areNumbersOfCorrectType = typeof transaction.fee === 'number' &&
            typeof transaction.value === 'number' &&
            !isNaN(transaction.fee) &&
            !isNaN(transaction.value);
        if (!areNumbersOfCorrectType) {
            throw new Error('Invalid values');
        }

        const isSenderCorrect = this.validateAddress(transaction.from);
        if (!isSenderCorrect) {
            throw new Error('Invalid sender');
        }

        const isReceiverCorrect = this.validateAddress(transaction.to);
        if (!isReceiverCorrect) {
            throw new Error('Invalid receiver');
        }

        const senderHasEnoughBalance = this.chain.canSenderTransferTransaction(transaction);
        if (!senderHasEnoughBalance) {
            throw new Error('Sender balance is not enough');
        }

        let canPayFee = senderBalance > transaction.fee;
        if (!canPayFee) {
            throw new Error('Fee not enough');
        }

        const willNotOverflow = (receiverBalance + transaction.value) >= receiverBalance;
        if (!willNotOverflow) {
            throw new Error('Invalid value');
        }

        const isValueGreaterThanOrEqualToZero = transaction.value >= 0;
        if (!isValueGreaterThanOrEqualToZero) {
            throw new Error('Cannot send negative value');
        }

        const isSignatureValid = BurgerWallet.verify(transaction);
        if (!isSignatureValid) {
            throw new Error('Invalid signature');
        }
        const isFeeGreaterThanEqualToMinimum = transaction.fee >= minimumFee;
        if (!isFeeGreaterThanEqualToMinimum) {
            throw new Error('Low fee');
        }

        const transactionDataHashMustBeUnique = this.chain.pendingTransactions.filter(tx => tx.transactionDataHash === transaction.transactionDataHash).length === 0;
        if (!transactionDataHashMustBeUnique) {
            throw new Error('Rejected due to duplicate transaction');
        }

        if (transaction.from === '0000000000000000000000000000000000000000') {
            canPayFee = true;
            isSignatureValid = true;
        }

        return areKeysEqual &&
            canPayFee &&
            willNotOverflow &&
            isValueGreaterThanOrEqualToZero &&
            isSenderCorrect &&
            isReceiverCorrect &&
            isSignatureValid &&
            isFeeGreaterThanEqualToMinimum &&
            isTransactionDataHashValid &&
            transactionDataHashMustBeUnique &&
            areNumbersOfCorrectType &&
            senderHasEnoughBalance
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
                transactions = transactions.concat(blockTransaction);
            }
        }
        const pendingTransactions = this.chain.pendingTransactions.filter((transaction) => {
            return transaction.to === address || transaction.from === address;
        });
        if (pendingTransactions.length > 0) {
            transactions = transactions.concat(pendingTransactions);
        }

        transactions.sort((tx1, tx2) => {
            return new Date(tx1.dateCreated) < new Date(tx2.dateCreated);
        });
        return {
            address,
            transactions
        };
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