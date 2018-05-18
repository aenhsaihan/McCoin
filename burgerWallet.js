const CryptoJS = require('crypto-js');
const EC = require('elliptic').ec;
const secp256k1 = new EC('secp256k1');

class BurgerWallet {
    constructor(privateKey) {
        this.key = null;
        this.publicKey = null;
        this.address = null;

        if (privateKey) {
            this.privateKey = privateKey
            this._recoverWallet(privateKey);
        } else {
            this._generateWallet();
        }
    }

    _recoverWallet(privateKey) {
        let keyPair = secp256k1.keyFromPrivate(privateKey);
        this._generateWallet(keyPair);
    }

    _generateWallet(rawKeyPair) {
        let keyPair = rawKeyPair ? rawKeyPair : secp256k1.genKeyPair();

        this.key = keyPair;

        let privateKey = keyPair.getPrivate();
        let publicKey = keyPair.getPublic();
        this.privateKey = privateKey.toString('hex');

        var keyCompressed = publicKey.encodeCompressed("hex");
        var tempY = keyCompressed.toString().substring(0, 2)
        var tempX = keyCompressed.toString().substring(2, keyCompressed.toString().length)

        let compressedPubKey = tempX + (tempY % 2)

        this.publicKey = compressedPubKey;

        let address = CryptoJS.RIPEMD160(compressedPubKey);
        this.address = address.toString();
    }

    sign(message) {
        const messageJSON = JSON.stringify(message);
        const messageHash = CryptoJS.SHA256(messageJSON).toString();
        const signature = this.key.sign(messageHash);
        const senderSignature = [signature.r.toString(16), signature.s.toString(16)];
        const messageResponse = {};
        Object.assign(messageResponse, message);
        messageResponse.transactionDataHash = messageHash;
        messageResponse.senderSignature = senderSignature;

        return messageResponse;
    }

    static recoverKeysFromPublicKey(publicKeyCompressed) {
        let pubKeyX = publicKeyCompressed.substring(0, 64)
        let pubKeyYOdd = parseInt(publicKeyCompressed.substring(64))
        let pubKeyPoint = secp256k1.curve.pointFromX(pubKeyX, pubKeyYOdd)
        let keyPair = secp256k1.keyPair({ pub: pubKeyPoint })
        return keyPair;
    }

    static verify(signedTransaction) {
        const keyPair = BurgerWallet.recoverKeysFromPublicKey(signedTransaction.senderPubKey);
        const transactionDataHash = signedTransaction.transactionDataHash;

        const signature = {
            r: signedTransaction.senderSignature[0],
            s: signedTransaction.senderSignature[1]
        };

        return keyPair.verify(transactionDataHash, signature);
    }
}

// Sanity Checks =====================
 const wallet = new BurgerWallet();
 console.log(wallet);

const message = {
    "from": "c3293572dbe6ebc60de4a20ed0e21446cae66b17",
    "to": "f51362b7351ef62253a227a77751ad9b2302f911",
    "value": 250123,
    "fee": 10,
    "dateCreated": "2018-01-10T17:53:48.972Z",
    "data": "funds",
    "senderPubKey": wallet.publicKey
}

const signedTransaction = wallet.sign(message);
console.log(signedTransaction);

const recoveredWallet = new BurgerWallet(wallet.privateKey);
console.log(recoveredWallet);

const verification = BurgerWallet.verify(signedTransaction);
console.log(verification);

module.exports = BurgerWallet;