const assert = require('assert');
const sinon = require('sinon');
const BurgerMiner = require('../../burgerMiner'); 


describe('BurgerMiner', function() {
    const now = new Date('2018-06-12T15:54:05.082Z');
    let sandbox;
    let clock;
    let burgerMiner;

    beforeEach(function() {
        sandbox = sinon.createSandbox();
        clock = sinon.useFakeTimers(now.getTime());
        burgerMiner = new BurgerMiner();
    });
    afterEach(function() {
        clock.restore();
    });
    describe('#calculateHash()', function() {
        it('Should calculate the correct hash', function() {
            const hash = burgerMiner.calculateHash('1234');
            assert.equal(hash, 'bdd886052f0e831d97598316eb9d1b02f1f8d1016cae58997cbfa3a46729ce3a');
        });
    });
    describe('#mineBlock()', function() {
        it('Should calculate the correct hash given a difficulty', function() {
            const hash = burgerMiner.mineBlock('1234', 1);
            assert.equal(hash.blockDataHash, '1234');
            assert.equal(hash.blockHash, '0f2e9108cd1cb7c8fc7c52a2de5160592ac4817789ea98c16e209671c8f6905d');
            assert.equal(hash.nonce, 40);
            assert.equal(hash.dateCreated, '2018-06-12T15:54:05.082Z');

            assert.equal(burgerMiner.blockDataHash, '');
            assert.equal(burgerMiner.blockHash, '');
            assert.equal(burgerMiner.nonce, 0);
            assert.equal(burgerMiner.dateCreated, '');
        });

        it('Should get the copied instance variables after mining', function() {
            const stub = sinon.stub(burgerMiner, 'resetInstance');
            stub.returns({
                blockDataHash: 'test1',
                blockHash: 'test2',
                nonce: 'test3',
                dateCreated: 'test4'
            })

            const hash = burgerMiner.mineBlock('1234', 1);

            assert.equal(hash.blockDataHash, 'test1');
            assert.equal(hash.blockHash, 'test2');
            assert.equal(hash.nonce, 'test3');
            assert.equal(hash.dateCreated, 'test4');
        })
    });
});