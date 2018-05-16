const BurgerBlock = require('./burgerBlock');
const BurgerTransaction = require('./burgerTransaction');
const BurgerMiner = require("./burgerMiner");

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

    replaceChain(newChain) {
      this.chain = newChain;
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

    addPendingTransaction(transaction){
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

        const sentTransactionHash = transaction.transactionDataHash; // verify off of the generated transaction hash and if != dont push return false
        this.chain.pendingTransactions.push(burgerTransaction);
    }

    addMinedBlock(minedBlock) {
      this.chain.addMinedBlock(minedBlock);
    }

    validateChain() {

    }
}

module.exports = BurgerNode;
