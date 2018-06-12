const HashProvider = require('./hashProvider');

class BurgerTransaction {

    constructor(from, to, value, fee, dateCreated, data, senderPubKey, senderSignature) {
        this.from = from;
        this.to = to;
        this.value = value; //in micro burgers
        this.fee = fee; //in micro burgers
        this.dateCreated = new Date(dateCreated).toISOString();
        this.data = data;
        this.senderPubKey = senderPubKey;
        this.senderSignature = senderSignature;
        this.minedInBlockIndex = null; //int
        this.transferSuccessful = null; //bool
        this.transactionDataHash = BurgerTransaction.computetransactionDataHash(this);
    }

    get rawDocumentObject() {
        return Object.assign({}, this);
    }

    static computetransactionDataHash(tx) {
        const transactionData = {
            from: tx.from,
            to: tx.to,
            value: tx.value,
            fee: tx.fee,
            dateCreated: tx.dateCreated,
            data: tx.data,
            senderPubKey: tx.senderPubKey
        };
        return HashProvider.calculateTransactionDataHash(transactionData);
    }

}

module.exports = BurgerTransaction;