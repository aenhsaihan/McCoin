const crypto = require('crypto-js');
const BurgerWallet = require('./burgerWallet');

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
        this.transactionDataHash = this.computetransactionDataHash();
    }

    get rawDocumentObject() {
        return Object.assign({}, this);
    }

    computetransactionDataHash() {
        const transactionData = {
            from: this.from,
            to: this.to,
            value: this.value,
            fee: this.fee,
            dateCreated: this.dateCreated,
            data: this.data,
            senderPubKey: this.senderPubKey
        };
        const transactionDataHash = crypto.SHA256(JSON.stringify(transactionData));
        return transactionDataHash.toString();
    }

    static isTransactionValid(signedTransaction) {
        const keyPair = BurgerWallet.recoverKeysFromPublicKey(signedTransaction.senderPubKey);
        const transactionDataHash = signedTransaction.transactionDataHash;

        const signature = {
            r: signedTransaction.senderSignature[0],
            s: signedTransaction.senderSignature[1]
        };

        return keyPair.verify(transactionDataHash, signature);
    }

}

module.exports = BurgerTransaction;