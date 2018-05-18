const CryptoJS = require('crypto-js');
const Transaction = require('./burgerTransaction');

const request = require('request-promise');
const EC = require('elliptic').ec;
const secp256k1 = new EC('secp256k1');

const host = process.argv[2];
const port = process.argv[3];
const uri = host + ':' + port;
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

    sign(transaction) {
        const signature = this.key.sign(transaction.transactionDataHash);
        const senderSignature = [signature.r.toString(16), signature.s.toString(16)];
        transaction.senderSignature = senderSignature;
        return transaction;
    }

    async send(transaction) {
        transaction.senderSignature = this.publicKey;
        const signedTransaction = this.sign(transaction);

        const options = {
            method: 'POST',
            uri: uri + '/transactions/send',
            body: {
                transaction: signedTransaction.rawDocumentObject,
            },
            json: true
        }

        const response = await request(options);
        return response;
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

module.exports = BurgerWallet;