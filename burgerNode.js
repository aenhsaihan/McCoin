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

    mine(minerAddress){

        const candidateBlock = this.chain.prepareCandidateBlock(minerAddress);

        const miner = new BurgerMiner(candidateBlock.blockDataHash, 0);
        const minedInfo = miner.mineBlock();
        if(minedInfo){
           const {
                nonce,
                dateCreated,
                hash
            } = minedInfo;

            candidateBlock.nonce=nonce;
            candidateBlock.dateCreated=dateCreated;
            candidateBlock.blockHash=hash;

            if(this.chain.canAddBlock(candidateBlock)){
                this.chain.addBlock(candidateBlock);
                return "Added To the Chain";
            }
            return "Block Already In chain";
        }else{
            return "Timedout";
        }
    }

    validateChain() {

    }
}

module.exports = BurgerNode;
