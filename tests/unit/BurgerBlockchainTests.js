const assert = require('assert');
const sinon = require('sinon');

const BurgerBlockchain = require('../../burgerBlockchain');
const BurgerBlock = require('../../burgerBlock');
const BurgerTransaction = require('../../burgerTransaction');

describe('BurgerBlockchain', function () {
    let burgerBlockchain = new BurgerBlockchain();

    beforeEach(function () {
        burgerBlockchain = new BurgerBlockchain();
    });
    describe('#constructor()', function () {
        it('Should instantiate with the genesis block at blocks[0]', function () {
            const blockZero = burgerBlockchain.blocks[0];
            const genesisBlock = burgerBlockchain.createGenesisBlock();

            assert.equal(JSON.stringify(blockZero), JSON.stringify(genesisBlock));
        });
    });
    describe('.createNewInstance()', function () {
        it('Should create a new instance from predefined properties', function () {
            const newChain = BurgerBlockchain.createNewInstance({
                test: 'newInstanceOK'
            });
            assert.equal(newChain instanceof BurgerBlockchain, true);
            assert.equal(newChain.test, 'newInstanceOK');
        });
    });
    describe('#addBlock()', function () {
        it('Should add a block', function () {
            const burgerTransaction = new BurgerTransaction(1, 2, 3, 4, new Date(), 5, 6, 7);
            const burgerBlock = new BurgerBlock(1, [burgerTransaction], 100, '', '');
            burgerBlockchain.pendingTransactions.push(burgerTransaction);

            burgerBlockchain.addBlock(burgerBlock);
            assert.equal(burgerBlockchain.cumulativeDifficulty, Math.pow(16, 100));
            assert.equal(burgerBlockchain.blocks.length, 2);
        });
    });
    describe('#flushPendingTransactions', function () {
        it('Should flush the pending transactions', function () {
            const burgerTransaction = new BurgerTransaction(1, 2, 3, 4, new Date(), 5, 6, 7);
            const burgerBlock = new BurgerBlock(1, [burgerTransaction], 100, '', '');
            burgerBlockchain.pendingTransactions.push(burgerTransaction);

            assert.equal(burgerBlockchain.pendingTransactions.length, 1);
            burgerBlockchain.flushPendingTransactions(burgerBlock);
            assert.equal(burgerBlockchain.pendingTransactions.length, 0);
        });
        it('Should flush the pending transactions included on a block only', function () {
            const burgerTransaction1 = new BurgerTransaction(1, 2, 3, 4, new Date(), 5, 6, 7);
            const burgerTransaction2 = new BurgerTransaction(7, 6, 5, 4, new Date(), 3, 2, 1);
            const burgerBlock = new BurgerBlock(1, [burgerTransaction1], 100, '', '');
            burgerBlockchain.pendingTransactions.push(burgerTransaction1);
            burgerBlockchain.pendingTransactions.push(burgerTransaction2);

            assert.equal(burgerBlockchain.pendingTransactions.length, 2);
            burgerBlockchain.flushPendingTransactions(burgerBlock);
            assert.equal(burgerBlockchain.pendingTransactions.length, 1);
            assert.equal(burgerBlockchain.pendingTransactions[0].transactionDataHash, burgerTransaction2.transactionDataHash);
        });
    });
    describe('#createMiningJob()', function () {
        it('Should create a mining job', function () {
            const burgerTransaction1 = new BurgerTransaction(1, 2, 3, 4, new Date(), 5, 6, 7);
            const burgerBlock = new BurgerBlock(1, [burgerTransaction1], 100, '', '');
            burgerBlockchain.createMiningJob(burgerBlock);

            assert.equal(Object.keys(burgerBlockchain.miningJobs).length, 1);
            assert.equal(burgerBlockchain.miningJobs[burgerBlock.blockDataHash].blockDataHash, burgerBlock.blockDataHash);
        });
    });
    describe('#getLastBlock()', function () {
        it('Should return the last block', function () {
            const burgerTransaction1 = new BurgerTransaction(1, 2, 3, 4, new Date(), 5, 6, 7);
            const burgerTransaction2 = new BurgerTransaction(7, 6, 5, 4, new Date(), 3, 2, 1);
            const burgerBlock1 = new BurgerBlock(1, [burgerTransaction1], 100, '', '');
            const burgerBlock2 = new BurgerBlock(1, [burgerTransaction2], 100, '', '');
            burgerBlockchain.blocks.push(burgerBlock1);
            burgerBlockchain.blocks.push(burgerBlock2);

            assert.equal(burgerBlockchain.getLastBlock().blockDataHash, burgerBlock2.blockDataHash);
        });
    });
    describe('#canAddBlock()', function () {
        let burgerBlockData;

        beforeEach(function () {
            burgerBlockData = BurgerBlock.createNewInstance({
                "index": 1,
                "transactions": [{
                    "from": "0000000000000000000000000000000000000000",
                    "to": "492bceee1efc35da07362ba7f523a8ba45469b54",
                    "value": 500000,
                    "fee": 0,
                    "dateCreated": "2018-06-13T19:39:06.350Z",
                    "data": "coinbase tx",
                    "senderPubKey": "00000000000000000000000000000000000000000000000000000000000000000",
                    "senderSignature": [
                        "0000000000000000000000000000000000000000000000000000000000000000",
                        "0000000000000000000000000000000000000000000000000000000000000000"
                    ],
                    "minedInBlockIndex": 1,
                    "transferSuccessful": true,
                    "transactionDataHash": "f66112a9925edfba13458aaa9a0930ee532e1fe54e148f8f29f0d901fcd4ed7b"
                }],
                "difficulty": 4,
                "prevBlockhash": "232e447f6a0a065112b396aaa49cc52b0ff76c37cbd9169635992c207b8f10df",
                "minedBy": "492bceee1efc35da07362ba7f523a8ba45469b54",
                "prevBlockHash": "232e447f6a0a065112b396aaa49cc52b0ff76c37cbd9169635992c207b8f10df",
                "blockDataHash": "4c4d2fa5c84e5ecb5a2da4b46560f175acf0e078969d6796405d83cdc4981010",
                "nonce": 17466,
                "dateCreated": "2018-06-13T19:39:07.214Z",
                "blockHash": "0000cd6368abc08945396f7b69a09587a60b41ea99b50615fefbe6c4690a1eee"
            });
        });
        it('Should add a valid block', function () {
            assert.equal(burgerBlockchain.canAddBlock(burgerBlockData), true);
        });
        it('Should reject the invalid block due to blockHash mismatch', function () {
            burgerBlockData.blockHash = burgerBlockData.blockHash + 'XXXXXXXX';
            assert.equal(burgerBlockchain.canAddBlock(burgerBlockData), false);
        });
        it('Should reject the invalid block due to bad blockIndex', function () {
            burgerBlockData.index = burgerBlockchain.blocks[0].index;
            assert.equal(burgerBlockchain.canAddBlock(burgerBlockData), false);
        });
    });
    describe('#prepareCandidateBlock', function () {
        it('Should prepare a candidate block properly', function () {
            const candidateBlock = burgerBlockchain.prepareCandidateBlock('Arthur McKinley');
            
            assert.equal(Object.keys(burgerBlockchain.miningJobs).length, 1);
            assert.equal(candidateBlock.transactions[0].to, 'Arthur McKinley');
            assert.equal(Object.keys(burgerBlockchain.miningJobs).length, 1);
            assert.equal(burgerBlockchain.miningJobs[candidateBlock.blockDataHash].minedBy, 'Arthur McKinley');
        });
        it('Should add the pending transactions to the candidate block', function () {
            let validTransaction = new BurgerTransaction(1, 2, 3, 4, new Date(), 5, 6, 7);
            Object.assign(validTransaction, {
                "from": "e9e12fe5c7d3330f83d7a374ca1bacc0cc730196",
                "to": "0c85108aeae5c933c3c1d97557908281398822c6",
                "value": 100,
                "fee": 10,
                "dateCreated": "2018-06-13T19:57:38.431Z",
                "data": "",
                "senderPubKey": "7135be26422c9edf15ebb3076694f9acb5f6d37460b8352225863a32247b04fd1",
                "senderSignature": [
                    "c49442a0dde3e97a6aaa3a1350cd574a4ef9b058038d7b06864dfbccddaa113b",
                    "853b8d4e2654b4aedf0b349ef0650f634426b8f7c572523b78f4952af0c5d5c2"
                ],
                "minedInBlockIndex": null,
                "transferSuccessful": null,
                "transactionDataHash": "3b473d6481df109d20e211d7350c54cee1f7348f394e225041a1140072372864"
            });
            burgerBlockchain.pendingTransactions.push(validTransaction);

            const candidateBlock = burgerBlockchain.prepareCandidateBlock('Magellan');

            assert.equal(candidateBlock.transactions.length, 2);
            assert.equal(candidateBlock.transactions[0].to, 'Magellan');
            assert.equal(Object.keys(burgerBlockchain.miningJobs).length, 1);
            assert.equal(burgerBlockchain.miningJobs[candidateBlock.blockDataHash].minedBy, 'Magellan');
        });
        it('Should verify the transactions in a block and set the transferSuccessful property correctly', function () {
            let validTransaction = new BurgerTransaction(1, 2, 3, 4, new Date(), 5, 6, 7);
            Object.assign(validTransaction, {
                "from": "e9e12fe5c7d3330f83d7a374ca1bacc0cc730196",
                "to": "0c85108aeae5c933c3c1d97557908281398822c6",
                "value": 100,
                "fee": 10,
                "dateCreated": "2018-06-13T19:57:38.431Z",
                "data": "",
                "senderPubKey": "7135be26422c9edf15ebb3076694f9acb5f6d37460b8352225863a32247b04fd1",
                "senderSignature": [
                    "c49442a0dde3e97a6aaa3a1350cd574a4ef9b058038d7b06864dfbccddaa113b",
                    "853b8d4e2654b4aedf0b349ef0650f634426b8f7c572523b78f4952af0c5d5c2"
                ],
                "minedInBlockIndex": null,
                "transferSuccessful": null,
                "transactionDataHash": "3b473d6481df109d20e211d7350c54cee1f7348f394e225041a1140072372864"
            });
            burgerBlockchain.pendingTransactions.push(validTransaction);
            const burgerTransaction1 = new BurgerTransaction(1, 2, 3, 4, new Date(), 5, 6, 7);
            burgerBlockchain.pendingTransactions.push(burgerTransaction1);
            const candidateBlock = burgerBlockchain.prepareCandidateBlock('John Doe');

            assert.equal(candidateBlock.transactions.length, 3);
            assert.equal(candidateBlock.transactions[0].transferSuccessful, true);
            assert.equal(candidateBlock.transactions[1].transferSuccessful, true);
            assert.equal(candidateBlock.transactions[2].transferSuccessful, false);
        });
        it('Should add the fees to the coinbase transaction', function() {
            burgerBlockchain.pendingTransactions.push({
                "from": "e9e12fe5c7d3330f83d7a374ca1bacc0cc730196",
                "to": "a33d1cb7d8925f05c2036fbe58660f2a70acc10f",
                "value": 100,
                "fee": 10,
                "dateCreated": "2018-06-13T20:34:56.821Z",
                "data": "",
                "senderPubKey": "7135be26422c9edf15ebb3076694f9acb5f6d37460b8352225863a32247b04fd1",
                "senderSignature": [
                    "8938d95ebffc5dd217cfcc112debf68478710e4efdb10ae6166a9c359413c449",
                    "b37c4c8a12e57caa021781a3706d7c847f91b511d10c32271c1b8e472fb7c106"
                ],
                "minedInBlockIndex": null,
                "transferSuccessful": null,
                "transactionDataHash": "00000e049b8e902fc86d2c1b97d36117a9fb8709e9d8f8993f2697391025b590"
            });
            burgerBlockchain.pendingTransactions.push({
                "from": "e9e12fe5c7d3330f83d7a374ca1bacc0cc730196",
                "to": "a33d1cb7d8925f05c2036fbe58660f2a70acc10f",
                "value": 100,
                "fee": 20,
                "dateCreated": "2018-06-13T20:34:56.821Z",
                "data": "",
                "senderPubKey": "7135be26422c9edf15ebb3076694f9acb5f6d37460b8352225863a32247b04fd1",
                "senderSignature": [
                    "8938d95ebffc5dd217cfcc112debf68478710e4efdb10ae6166a9c359413c449",
                    "b37c4c8a12e57caa021781a3706d7c847f91b511d10c32271c1b8e472fb7c106"
                ],
                "minedInBlockIndex": null,
                "transferSuccessful": null,
                "transactionDataHash": "7fea0e049b8e902fc86d2c1b97d36117a9fb8709e9d8f8993f2697391025b590"
            });
            const candidateBlock = burgerBlockchain.prepareCandidateBlock('John Doe');
            assert.equal(candidateBlock.transactions.length, 3);
            assert.equal(candidateBlock.transactions[0].value, 500030);
        });
        it('Should not allow two same transaction data hash to go into the block', function() {
            burgerBlockchain.pendingTransactions.push({
                "from": "e9e12fe5c7d3330f83d7a374ca1bacc0cc730196",
                "to": "a33d1cb7d8925f05c2036fbe58660f2a70acc10f",
                "value": 100,
                "fee": 10,
                "dateCreated": "2018-06-13T20:34:56.821Z",
                "data": "",
                "senderPubKey": "7135be26422c9edf15ebb3076694f9acb5f6d37460b8352225863a32247b04fd1",
                "senderSignature": [
                    "8938d95ebffc5dd217cfcc112debf68478710e4efdb10ae6166a9c359413c449",
                    "b37c4c8a12e57caa021781a3706d7c847f91b511d10c32271c1b8e472fb7c106"
                ],
                "minedInBlockIndex": null,
                "transferSuccessful": null,
                "transactionDataHash": "7fea0e049b8e902fc86d2c1b97d36117a9fb8709e9d8f8993f2697391025b590"
            });
            burgerBlockchain.pendingTransactions.push({
                "from": "e9e12fe5c7d3330f83d7a374ca1bacc0cc730196",
                "to": "a33d1cb7d8925f05c2036fbe58660f2a70acc10f",
                "value": 100,
                "fee": 20,
                "dateCreated": "2018-06-13T20:34:56.821Z",
                "data": "",
                "senderPubKey": "7135be26422c9edf15ebb3076694f9acb5f6d37460b8352225863a32247b04fd1",
                "senderSignature": [
                    "8938d95ebffc5dd217cfcc112debf68478710e4efdb10ae6166a9c359413c449",
                    "b37c4c8a12e57caa021781a3706d7c847f91b511d10c32271c1b8e472fb7c106"
                ],
                "minedInBlockIndex": null,
                "transferSuccessful": null,
                "transactionDataHash": "7fea0e049b8e902fc86d2c1b97d36117a9fb8709e9d8f8993f2697391025b590"
            });
            const candidateBlock = burgerBlockchain.prepareCandidateBlock('John Doe');
            assert.equal(candidateBlock.transactions.length, 2);
            assert.equal(candidateBlock.transactions[0].value, 500010);
        });
    });
    describe('#createCoinbaseTransaction()', function () {
        const now = new Date('2018-06-13T20:14:49.334Z');
        let clock;

        beforeEach(function () {
            clock = sinon.useFakeTimers(now.getTime());
        });
        afterEach(function () {
            clock.restore();
        });

        it('Should create a proper coinbase transaction', function () {
            const transaction = burgerBlockchain.createCoinbaseTransaction('SUPERMAN');
            const coinbaseTx = {
                from: '0000000000000000000000000000000000000000',
                to: 'SUPERMAN',
                value: 500000,
                fee: 0,
                dateCreated: '2018-06-13T20:14:49.334Z',
                data: 'coinbase tx',
                senderPubKey: '00000000000000000000000000000000000000000000000000000000000000000',
                senderSignature: ['0000000000000000000000000000000000000000000000000000000000000000',
                    '0000000000000000000000000000000000000000000000000000000000000000'
                ],
                minedInBlockIndex: 1,
                transferSuccessful: true,
                transactionDataHash: '671b3505f5811028f6bf09a2f9dd15384f14c2f07f578e2a6424db6191a2dccd'
            }
            assert.equal(JSON.stringify(transaction), JSON.stringify(coinbaseTx));
        });
    });

    function balancesTest() {
        let burgerBlockchain = new BurgerBlockchain();

        before(function () {
            const blocks = [
                {
                    "index": 1,
                    "transactions": [{
                        "from": "0000000000000000000000000000000000000000",
                        "to": "492bceee1efc35da07362ba7f523a8ba45469b54",
                        "value": 500000,
                        "fee": 0,
                        "dateCreated": "2018-06-13T20:19:21.084Z",
                        "data": "coinbase tx",
                        "senderPubKey": "00000000000000000000000000000000000000000000000000000000000000000",
                        "senderSignature": [
                            "0000000000000000000000000000000000000000000000000000000000000000",
                            "0000000000000000000000000000000000000000000000000000000000000000"
                        ],
                        "minedInBlockIndex": 1,
                        "transferSuccessful": true,
                        "transactionDataHash": "f9ae4be40baa17dab089ad448d814382b2115dccd1ba34b5b43505b60491f8d4"
                    }],
                    "difficulty": 4,
                    "prevBlockhash": "232e447f6a0a065112b396aaa49cc52b0ff76c37cbd9169635992c207b8f10df",
                    "minedBy": "492bceee1efc35da07362ba7f523a8ba45469b54",
                    "prevBlockHash": "232e447f6a0a065112b396aaa49cc52b0ff76c37cbd9169635992c207b8f10df",
                    "blockDataHash": "57431110bcd7a053081c97b033b323b1675f25cfa09d1292fc81c31a253a758d",
                    "nonce": 144231,
                    "dateCreated": "2018-06-13T20:19:27.157Z",
                    "blockHash": "0000ba91189de52bc2efd2bb09ccef1f29f1b9b598666d2a3389398d9ea27cd4"
                },
                {
                    "index": 2,
                    "transactions": [{
                        "from": "0000000000000000000000000000000000000000",
                        "to": "492bceee1efc35da07362ba7f523a8ba45469b54",
                        "value": 500000,
                        "fee": 0,
                        "dateCreated": "2018-06-13T20:19:28.236Z",
                        "data": "coinbase tx",
                        "senderPubKey": "00000000000000000000000000000000000000000000000000000000000000000",
                        "senderSignature": [
                            "0000000000000000000000000000000000000000000000000000000000000000",
                            "0000000000000000000000000000000000000000000000000000000000000000"
                        ],
                        "minedInBlockIndex": 2,
                        "transferSuccessful": true,
                        "transactionDataHash": "bc6ea822a441b5df0048a14c22da476948e75bf2f5791ae27ab00f9bba8123ae"
                    }],
                    "difficulty": 4,
                    "prevBlockhash": "0000ba91189de52bc2efd2bb09ccef1f29f1b9b598666d2a3389398d9ea27cd4",
                    "minedBy": "492bceee1efc35da07362ba7f523a8ba45469b54",
                    "prevBlockHash": "0000ba91189de52bc2efd2bb09ccef1f29f1b9b598666d2a3389398d9ea27cd4",
                    "blockDataHash": "d8193856552dc635341cb9f849d04d1aec0449bce0c30f09a2c448038b4a2315",
                    "nonce": 34547,
                    "dateCreated": "2018-06-13T20:19:29.617Z",
                    "blockHash": "0000a27c00484bbae1b27ae7e86e48423a6c0e7b484fabf74b4418b295025f3e"
                },
                {
                    "index": 3,
                    "transactions": [{
                        "from": "0000000000000000000000000000000000000000",
                        "to": "492bceee1efc35da07362ba7f523a8ba45469b54",
                        "value": 500000,
                        "fee": 0,
                        "dateCreated": "2018-06-13T20:19:30.644Z",
                        "data": "coinbase tx",
                        "senderPubKey": "00000000000000000000000000000000000000000000000000000000000000000",
                        "senderSignature": [
                            "0000000000000000000000000000000000000000000000000000000000000000",
                            "0000000000000000000000000000000000000000000000000000000000000000"
                        ],
                        "minedInBlockIndex": 3,
                        "transferSuccessful": true,
                        "transactionDataHash": "b327fad7617a079a4d10ce3a83d19a15def7709a1c7b48f4cfcc30f3de0c48e7"
                    }],
                    "difficulty": 4,
                    "prevBlockhash": "0000a27c00484bbae1b27ae7e86e48423a6c0e7b484fabf74b4418b295025f3e",
                    "minedBy": "492bceee1efc35da07362ba7f523a8ba45469b54",
                    "prevBlockHash": "0000a27c00484bbae1b27ae7e86e48423a6c0e7b484fabf74b4418b295025f3e",
                    "blockDataHash": "85633c4e56be55cfad6e600c449ed7adc7bdb5608ecce4e28fbe57a5a569d10e",
                    "nonce": 80998,
                    "dateCreated": "2018-06-13T20:19:33.850Z",
                    "blockHash": "0000d080ef9118fa659dce84aa078a34a18385a273d73f3ee79b028f898dc799"
                },
                {
                    "index": 4,
                    "transactions": [{
                        "from": "0000000000000000000000000000000000000000",
                        "to": "492bceee1efc35da07362ba7f523a8ba45469b54",
                        "value": 500000,
                        "fee": 0,
                        "dateCreated": "2018-06-13T20:19:34.868Z",
                        "data": "coinbase tx",
                        "senderPubKey": "00000000000000000000000000000000000000000000000000000000000000000",
                        "senderSignature": [
                            "0000000000000000000000000000000000000000000000000000000000000000",
                            "0000000000000000000000000000000000000000000000000000000000000000"
                        ],
                        "minedInBlockIndex": 4,
                        "transferSuccessful": true,
                        "transactionDataHash": "417f87a86e2f726783da975d3312abbcca3f53eba2f653bfd45b43f4b5d1253a"
                    }],
                    "difficulty": 4,
                    "prevBlockhash": "0000d080ef9118fa659dce84aa078a34a18385a273d73f3ee79b028f898dc799",
                    "minedBy": "492bceee1efc35da07362ba7f523a8ba45469b54",
                    "prevBlockHash": "0000d080ef9118fa659dce84aa078a34a18385a273d73f3ee79b028f898dc799",
                    "blockDataHash": "154421a7ce1295c6ab5bbe9fe5f443de185ef4878b22af4d39a879e5a4845c79",
                    "nonce": 34077,
                    "dateCreated": "2018-06-13T20:19:36.180Z",
                    "blockHash": "0000f2b040e00db0fc37f64b55145ff7ae0cde9705b863123e652c682c790961"
                },
                {
                    "index": 5,
                    "transactions": [{
                        "from": "0000000000000000000000000000000000000000",
                        "to": "492bceee1efc35da07362ba7f523a8ba45469b54",
                        "value": 500000,
                        "fee": 0,
                        "dateCreated": "2018-06-13T20:19:37.209Z",
                        "data": "coinbase tx",
                        "senderPubKey": "00000000000000000000000000000000000000000000000000000000000000000",
                        "senderSignature": [
                            "0000000000000000000000000000000000000000000000000000000000000000",
                            "0000000000000000000000000000000000000000000000000000000000000000"
                        ],
                        "minedInBlockIndex": 5,
                        "transferSuccessful": true,
                        "transactionDataHash": "bd114bc80eeed93e28fcaedb5d78c84d26f27460cb02b3141f34b85e9f654e52"
                    }],
                    "difficulty": 4,
                    "prevBlockhash": "0000f2b040e00db0fc37f64b55145ff7ae0cde9705b863123e652c682c790961",
                    "minedBy": "492bceee1efc35da07362ba7f523a8ba45469b54",
                    "prevBlockHash": "0000f2b040e00db0fc37f64b55145ff7ae0cde9705b863123e652c682c790961",
                    "blockDataHash": "7c59eb4d30092ec11e5dd58df5e2140e06b469ddbbf10a1c40ad169a85140922",
                    "nonce": 74888,
                    "dateCreated": "2018-06-13T20:19:40.129Z",
                    "blockHash": "00001e0f0e42c554b61384cea64491ffb5070a9f3dc047bec40c0582ec9fcf22"
                },
                {
                    "index": 6,
                    "transactions": [{
                        "from": "0000000000000000000000000000000000000000",
                        "to": "492bceee1efc35da07362ba7f523a8ba45469b54",
                        "value": 500000,
                        "fee": 0,
                        "dateCreated": "2018-06-13T20:19:41.162Z",
                        "data": "coinbase tx",
                        "senderPubKey": "00000000000000000000000000000000000000000000000000000000000000000",
                        "senderSignature": [
                            "0000000000000000000000000000000000000000000000000000000000000000",
                            "0000000000000000000000000000000000000000000000000000000000000000"
                        ],
                        "minedInBlockIndex": 6,
                        "transferSuccessful": true,
                        "transactionDataHash": "393ba412c2b37fbf02d743ba69b869234f01f25f7bfc3b7f3537c6f737b16869"
                    }],
                    "difficulty": 4,
                    "prevBlockhash": "00001e0f0e42c554b61384cea64491ffb5070a9f3dc047bec40c0582ec9fcf22",
                    "minedBy": "492bceee1efc35da07362ba7f523a8ba45469b54",
                    "prevBlockHash": "00001e0f0e42c554b61384cea64491ffb5070a9f3dc047bec40c0582ec9fcf22",
                    "blockDataHash": "a27e2454b771a596c94eb727fcecbfe4e795418ffd1165b9362db464ee2380d4",
                    "nonce": 28033,
                    "dateCreated": "2018-06-13T20:19:42.242Z",
                    "blockHash": "000049ede22ca47f77c3444373628da692f55dbd94cdf33f351c1adcb0b5b4c6"
                },
                {
                    "index": 7,
                    "transactions": [{
                        "from": "0000000000000000000000000000000000000000",
                        "to": "492bceee1efc35da07362ba7f523a8ba45469b54",
                        "value": 500000,
                        "fee": 0,
                        "dateCreated": "2018-06-13T20:23:00.293Z",
                        "data": "coinbase tx",
                        "senderPubKey": "00000000000000000000000000000000000000000000000000000000000000000",
                        "senderSignature": [
                            "0000000000000000000000000000000000000000000000000000000000000000",
                            "0000000000000000000000000000000000000000000000000000000000000000"
                        ],
                        "minedInBlockIndex": 7,
                        "transferSuccessful": true,
                        "transactionDataHash": "61efed3625755fb9e12d8808860aea49ffb53c8d69ffb4cdb2e54f4b2649fb78"
                    }],
                    "difficulty": 4,
                    "prevBlockhash": "000049ede22ca47f77c3444373628da692f55dbd94cdf33f351c1adcb0b5b4c6",
                    "minedBy": "492bceee1efc35da07362ba7f523a8ba45469b54",
                    "prevBlockHash": "000049ede22ca47f77c3444373628da692f55dbd94cdf33f351c1adcb0b5b4c6",
                    "blockDataHash": "b1ac4c313cfaa5de542aab8bd3562c63186e6be7fb334dab948224ef67626c0b",
                    "nonce": 107435,
                    "dateCreated": "2018-06-13T20:23:04.763Z",
                    "blockHash": "0000e2da773621b0723588326494fc393aaacde38ad54748ab0d67e9ebdf26c8"
                }
            ]
            blocks.forEach((block) => {
                burgerBlockchain.addBlock(block);
            });
        });
        describe('#getSafeBalanceOfAddress()', function () {
            it('Should retrieve the balance of address after 6 confirmations', function () {
                assert.equal(burgerBlockchain.getSafeBalanceOfAddress('492bceee1efc35da07362ba7f523a8ba45469b54'), 500000);
            });
        });
        describe('#getConfirmedBalanceOfAddress()', function () {
            it('Should retrieve the confirmed balance of address', function () {
                assert.equal(burgerBlockchain.getConfirmedBalanceOfAddress('492bceee1efc35da07362ba7f523a8ba45469b54'), 3500000);
            });
        });
        describe('#getPendingBalanceOfAddress()', function () {
            burgerBlockchain.pendingTransactions.push({
                "from": "e9e12fe5c7d3330f83d7a374ca1bacc0cc730196",
                "to": "a33d1cb7d8925f05c2036fbe58660f2a70acc10f",
                "value": 100,
                "fee": 10,
                "dateCreated": "2018-06-13T20:34:56.821Z",
                "data": "",
                "senderPubKey": "7135be26422c9edf15ebb3076694f9acb5f6d37460b8352225863a32247b04fd1",
                "senderSignature": [
                    "8938d95ebffc5dd217cfcc112debf68478710e4efdb10ae6166a9c359413c449",
                    "b37c4c8a12e57caa021781a3706d7c847f91b511d10c32271c1b8e472fb7c106"
                ],
                "minedInBlockIndex": null,
                "transferSuccessful": null,
                "transactionDataHash": "7fea0e049b8e902fc86d2c1b97d36117a9fb8709e9d8f8993f2697391025b590"
            });
            it('Should retrieve the pending balance of address', function () {
                assert.equal(burgerBlockchain.getPendingBalanceOfAddress('a33d1cb7d8925f05c2036fbe58660f2a70acc10f'), 100);
            });
        });
        describe('#calculateCumulativeDifficulty()', function() {
            it('Should calculate the cumulative difficulty of the chain', function() {
                assert.equal(burgerBlockchain.calculateCumulativeDifficulty(), (Math.pow(16, 4) * 7) + Math.pow(16, 0));
            });
        });
    }

    balancesTest();
});