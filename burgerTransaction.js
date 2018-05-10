const crypto = require('crypto-js');

class BurgerTransaction {

    constructor(from,to,value,fee,dateCreated,data,senderPubKey,senderSignature){
        this.from = from;
        this.to = to;
        this.value = value;//in micro burgers
        this.fee= fee;//in micro burgers
        this.dateCreated= dateCreated;
        this.data = data;
        this.senderPubKey=senderPubKey;
        this.senderSignature = senderSignature;
        this.minedInBlockIndex = null;//int
        this.transferSuccessful = null;//bool
    }
    get transactionDataHash() {
        const transactionData = {
            from: this.from,
            to:this.to,
            value:this.value,
            fee: this.fee,
            dateCreated:this.dateCreated,
            data:this.data,
            senderPubKey:this.senderPubKey
        };
        const transactionDataHash = crypto.SHA256(JSON.stringify(transactionData));
    
        return transactionDataHash;
    }
    
}

module.exports = BurgerTransaction;
