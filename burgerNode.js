class BurgerNode {
    constructor() {
        this.chain = []
        this.pendingTransactions = []
        this.nodes = []
        this.createNewBlock('00000000000', '0') // genesisBlock

    }

    createNewBlock(proof, previousHash, confirmedTransactions = []) {
        const block = {
            index: this.chain.length + 1,
            timestamp: new Date().toISOString(),
            transactions: confirmedTransactions,
            proof,
            previousHash
        }

        this.chain.push(block)
        return block
    }

    addNodeToNetwork( address){
        
        this.nodes.push(address)

    }
}

module.exports = BurgerNode