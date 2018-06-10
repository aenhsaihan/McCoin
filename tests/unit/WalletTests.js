const assert = require('assert');
const faker = require('faker');

const BurgerNode = require('../../burgerNode');
const BurgerTransaction = require('../../burgerTransaction');
const BurgerBlockchain = require('../../burgerBlockchain');
const BurgerWallet = require('../../burgerWallet');

describe('BurgerWallet', function() {
    it('Should generate a new wallet when private key is not specified', function() {
        const burgerWallet = new BurgerWallet();
        const actualKeys = Object.keys(burgerWallet);
        const validKeys = [ 'key', 'publicKey', 'address', 'privateKey' ];
        assert.equal(typeof burgerWallet.key, 'object');
        assert.equal(typeof burgerWallet.publicKey, 'string');
        assert.equal(typeof burgerWallet.address, 'string');
        assert.equal(typeof burgerWallet.privateKey, 'string');
        assert.equal(JSON.stringify(validKeys), JSON.stringify(actualKeys));
    });
    it('Should recover a wallet from an existing private key', function() {
        const burgerWallet = new BurgerWallet('888b0359b613e6ff69f1bc8143d363090d0c51246474330e7718468aaf64673a');
        assert.equal(burgerWallet.publicKey, 'a4fb6795708de61099cd62132f3389c8afcfbcc265af3750d6dd3ecab4580e250');
        assert.equal(burgerWallet.address, '686b3af4a7166c4d88b7ae750cee7b43973770ab');
        assert.equal(burgerWallet.privateKey, '888b0359b613e6ff69f1bc8143d363090d0c51246474330e7718468aaf64673a');
    });
    describe('#sign()', function() {
        let burgerWallet;
        beforeEach(function() {
            burgerWallet = new BurgerWallet('888b0359b613e6ff69f1bc8143d363090d0c51246474330e7718468aaf64673a');
        });
        it('Should sign a transaction', function() {
            const burgerTransaction = new BurgerTransaction(
                burgerWallet.address,
                'ab7259786084219eef187b9db48ac17291962fd6',
                1000,
                100,
                new Date('2018-06-07T07:21:34.481Z'),
                'Hello World!',
                burgerWallet.publicKey
            );
            const signedTransaction = burgerWallet.sign(burgerTransaction);
            assert.equal(signedTransaction.minedInBlockIndex, null);
            assert.equal(signedTransaction.transferSuccessful, null);
            assert.equal(burgerTransaction.transactionDataHash, '77f7c909083ad3908db5336c092b7a7ef0bfc242c03bdfe56e7d2cd50e8df32a');
        });
    });
    describe('.verify()', function() {
        let burgerWallet;
        beforeEach(function() {
            burgerWallet = new BurgerWallet('888b0359b613e6ff69f1bc8143d363090d0c51246474330e7718468aaf64673a');
        });
        it('Should ensure that the transaction data hash is properly signed', function() {
            const burgerTransaction = new BurgerTransaction(
                burgerWallet.address,
                'ab7259786084219eef187b9db48ac17291962fd6',
                1000,
                100,
                new Date('2018-06-07T07:21:34.481Z'),
                'Hello World!',
                burgerWallet.publicKey
            );
            const signedTransaction = burgerWallet.sign(burgerTransaction);
            assert.equal(BurgerWallet.verify(signedTransaction), true);
        })
    })
})