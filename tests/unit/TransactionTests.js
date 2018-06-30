const assert = require('assert');
const faker = require('faker');

const BurgerNode = require('../../burgerNode');
const BurgerTransaction = require('../../burgerTransaction');
const BurgerBlockchain = require('../../burgerBlockchain');
const BurgerWallet = require('../../burgerWallet');

const configurations = { selfUrl: 'test' };

describe('BurgerNode', function () {
    const sender = new BurgerWallet('831da5badbeacc2311f0bc301b19dea1f29ff67556345bcfafee9651f835809c');
    let receiver;
    let signedTx;
    let burgerBlockchain;
    let burgerNode;

    describe('#validateTransaction()', function() {
        beforeEach(function () {
            receiver = new BurgerWallet();
            burgerBlockchain = new BurgerBlockchain();
            burgerNode = new BurgerNode(burgerBlockchain, configurations);
        });
        it('Should fail due to mismatch in transaction data hash', function () {
            const transaction = new BurgerTransaction(
                sender.address,
                receiver.address,
                faker.random.number({
                    min: 10,
                    max: 100
                }),
                10,
                new Date(),
                faker.random.words(7),
                sender.publicKey
            );

            const signedTx = sender.sign(transaction);
            signedTx.transactionDataHash += '000';
            assert.throws(() => {
                burgerNode.validateTransaction(signedTx);
            }, /Invalid transaction data hash/);
        });
        it('Should fail due to object key mismatch', function () {
            const transaction = new BurgerTransaction(
                sender.address,
                receiver.address,
                faker.random.number({
                    min: 10,
                    max: 100
                }),
                10,
                new Date(),
                faker.random.words(7),
                sender.publicKey
            );
            transaction.unauthorizedData = '0000000000000000';

            const signedTx = sender.sign(transaction);

            assert.throws(() => {
                burgerNode.validateTransaction(signedTx);
            }, /Invalid transaction format/);
        });
    })

    describe('#addPendingTransaction()', function () {

        beforeEach(function () {
            receiver = new BurgerWallet();
            burgerBlockchain = new BurgerBlockchain();
            burgerNode = new BurgerNode(burgerBlockchain, configurations);
        });
        it('Should succeed due to correct inputs', function () {
            const transaction = new BurgerTransaction(
                sender.address,
                receiver.address,
                100,
                10,
                new Date(),
                faker.random.words(7),
                sender.publicKey
            );

            const signedTx = sender.sign(transaction);
            const result = burgerNode.addPendingTransaction(signedTx);
            assert.equal(true, result);
        });
        it('Should fail due to duplicate transactions', function () {
            const transaction = new BurgerTransaction(
                sender.address,
                receiver.address,
                100,
                10,
                new Date(),
                faker.random.words(7),
                sender.publicKey
            );

            const signedTx = sender.sign(transaction);

            // force duplicate...
            burgerNode.addPendingTransaction(signedTx);
            assert.throws(() => {
                burgerNode.addPendingTransaction(signedTx);
            }, /Rejected due to duplicate transaction/);
        });
        it('Should fail due to bad receiver', function () {
            const transaction = new BurgerTransaction(
                sender.address,
                receiver.address + '000',
                faker.random.number({
                    min: 10,
                    max: 100
                }),
                10,
                new Date(),
                faker.random.words(7),
                sender.publicKey
            );

            const signedTx = sender.sign(transaction);

            assert.throws(() => {
                burgerNode.addPendingTransaction(signedTx);
            }, /Invalid receiver/);
        });
        it('Should fail due to bad sender', function () {
            const transaction = new BurgerTransaction(
                sender.address + '000',
                receiver.address,
                faker.random.number({
                    min: 10,
                    max: 100
                }),
                10,
                new Date(),
                faker.random.words(7),
                sender.publicKey
            );

            const signedTx = sender.sign(transaction);

            assert.throws(() => {
                burgerNode.addPendingTransaction(signedTx);
            }, /Invalid sender/);
        });
        it('Should fail due to sender having not enough balance', function () {
            const newSender = new BurgerWallet();
            const transaction = new BurgerTransaction(
                newSender.address,
                receiver.address,
                faker.random.number({
                    min: 10,
                    max: 100
                }),
                10,
                new Date(),
                faker.random.words(7),
                newSender.publicKey
            );

            const signedTx = sender.sign(transaction);

            assert.throws(() => {
                burgerNode.addPendingTransaction(signedTx);
            }, /Sender balance is not enough/);
        });
        it('Should fail due to fee lower than minimum fee', function () {
            const transaction = new BurgerTransaction(
                sender.address,
                receiver.address,
                faker.random.number({
                    min: 10,
                    max: 100
                }),
                9,
                new Date(),
                faker.random.words(7),
                sender.publicKey
            );

            const signedTx = sender.sign(transaction);

            assert.throws(() => {
                burgerNode.addPendingTransaction(signedTx);
            }, /Low fee/);
        });
        it('Should fail due to invalid fee and amount', function () {
            const transaction = new BurgerTransaction(
                sender.address,
                receiver.address,
                'abcde456',
                'fghij123',
                new Date(),
                faker.random.words(7),
                sender.publicKey
            );

            const signedTx = sender.sign(transaction);

            assert.throws(() => {
                burgerNode.addPendingTransaction(signedTx);
            }, /Invalid values/);
        });
        it('Should fail due to negative value', function () {
            const transaction = new BurgerTransaction(
                sender.address,
                receiver.address,
                faker.random.number({
                    min: -10,
                    max: -100
                }),
                10,
                new Date(),
                faker.random.words(7),
                sender.publicKey
            );

            const signedTx = sender.sign(transaction);

            assert.throws(() => {
                burgerNode.addPendingTransaction(signedTx);
            }, /Invalid value/);
        });
    })
})