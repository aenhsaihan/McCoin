const request = require('supertest');
const assert = require('assert');
let app = require('../../server');
let server = app.server;
let burgerNode = app.burgerNode;

describe('Server', function () {
    beforeEach(function () {
        delete require.cache[require.resolve('../../server')];
        app = require('../../server');
        server = app.server;
        burgerNode = app.burgerNode;
        app.initializeServer(5555);
    });

    describe('/info', function () {
        it('Should return the information of the node', function (done) {
            burgerNode.nodeId = 'test';
            burgerNode.nodeUrl = 'test';

            request(server)
                .get('/info')
                .expect('Content-Type', /json/)
                .expect(200, {
                    about: 'McCoinChain/v0.1',
                    nodeId: 'test',
                    chainId: '232e447f6a0a065112b396aaa49cc52b0ff76c37cbd9169635992c207b8f10df',
                    nodeUrl: 'test',
                    peers: 0,
                    currentDifficulty: 4,
                    blocksCount: 1,
                    cumulativeDifficulty: 0,
                    confirmedTransactions: 1,
                    pendingTransactions: 0
                }, done);
        });
    });

    describe('/blocks', function () {
        it('Should return the blocks of the chain', function () {
            burgerNode.chain.blocks.push({});

            request(server)
                .get('/blocks')
                .expect(200)
                .expect('Content-Type', /json/)
                .then(function (res) {
                    const response = res.body;
                    assert.equal(response.length, 2);
                    assert.equal(response[0].blockHash, '232e447f6a0a065112b396aaa49cc52b0ff76c37cbd9169635992c207b8f10df');
                });
        });
    });

    describe('/blocks/:index', function () {
        it('Should return the block at the specified index', function (done) {
            burgerNode.chain.blocks.push({
                index: 1,
                data: 'test'
            });

            request(server)
                .get('/blocks/1')
                .expect('Content-Type', /json/)
                .expect(200, {
                    index: 1,
                    data: 'test'
                }, done);
        });
        it('Should send the appropriate error when an index is not found', function (done) {
            request(server)
                .get('/blocks/1')
                .expect('Content-Type', /json/)
                .expect(404, {
                    errorMsg: "Invalid block index"
                }, done);
        });
    });

    describe('/mining/submit-mined-block', function () {
        it('Should accept the mined block and clear the mining jobs', function (done) {
            const candidateBlock = {
                index: 1,
                transactions: [{
                    from: '0000000000000000000000000000000000000000',
                    to: '492bceee1efc35da07362ba7f523a8ba45469b54',
                    value: 500000,
                    fee: 0,
                    dateCreated: '2018-06-18T15:57:33.698Z',
                    data: 'coinbase tx',
                    senderPubKey: '00000000000000000000000000000000000000000000000000000000000000000',
                    senderSignature: [Array],
                    minedInBlockIndex: 1,
                    transferSuccessful: true,
                    transactionDataHash: 'bbe643a48497c35b63592d9272548d0f4f3547cd8ac41feba23952b79944a5a5'
                }],
                difficulty: 4,
                prevBlockhash: '232e447f6a0a065112b396aaa49cc52b0ff76c37cbd9169635992c207b8f10df',
                minedBy: '492bceee1efc35da07362ba7f523a8ba45469b54',
                prevBlockHash: '232e447f6a0a065112b396aaa49cc52b0ff76c37cbd9169635992c207b8f10df',
                blockDataHash: 'e2f71a1e17f69b8b3b00ae48722710643efa726dbe88d4ec7da9d5a9351273a8',
                nonce: 0,
                dateCreated: '2018-06-18T15:57:33.699Z',
                blockHash: null
            };
            burgerNode.chain.miningJobs['e2f71a1e17f69b8b3b00ae48722710643efa726dbe88d4ec7da9d5a9351273a8'] = candidateBlock;

            request(server)
                .post('/mining/submit-mined-block')
                .send({
                    blockDataHash: 'e2f71a1e17f69b8b3b00ae48722710643efa726dbe88d4ec7da9d5a9351273a8',
                    dateCreated: '2018-06-18T15:57:34.696Z',
                    nonce: 21015,
                    blockHash: '000056cbc949e184c70a8d45b990b250cce8d980f1b193bf027071fea64a9452'
                })
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200, {
                    message: 'Block accepted, reward paid: 500000 microburgers'
                })
                .then(function (res) {
                    assert.equal(burgerNode.chain.miningJobs.length, 0);
                    done();
                });
        });

        it('Should respond with an error when a submitted block is not found in the mining jobs', function (done) {
            request(server)
                .post('/mining/submit-mined-block')
                .send({
                    blockDataHash: 'e2f71a1e17f69b8b3b00ae48722710643efa726dbe88d4ec7da9d5a9351273a8',
                    dateCreated: '2018-06-18T15:57:34.696Z',
                    nonce: 21015,
                    blockHash: '000056cbc949e184c70a8d45b990b250cce8d980f1b193bf027071fea64a9452'
                })
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(404, {
                    errorMsg: "Block not found or already mined"
                }, done);
        });
    });

    describe('/mining/get-mining-job/:address', function () {
        it('Should respond with the latest mining job', function (done) {
            const pendingTransaction = {
                "from": "e9e12fe5c7d3330f83d7a374ca1bacc0cc730196",
                "to": "ef85b208900e7e29b4462b46b545939d9fe30ea2",
                "value": 100,
                "fee": 10,
                "dateCreated": "2018-06-18T16:16:03.552Z",
                "data": "",
                "senderPubKey": "7135be26422c9edf15ebb3076694f9acb5f6d37460b8352225863a32247b04fd1",
                "senderSignature": [
                    "eee2c19a30d4f650e0056f835b943522d53e8b9710fbdc33e2e6f1ff77cecd98",
                    "28a6ab889983511b958aa3f6d7543c439b2f181d4eeab5c2e600b593b4757503"
                ],
                "minedInBlockIndex": null,
                "transferSuccessful": null,
                "transactionDataHash": "c901efc7864c6a94137e7a0f559610bc091fc362c314dc954ea76d22ee733f75"
            }
            burgerNode.chain.pendingTransactions.push(pendingTransaction);

            request(server)
                .get('/mining/get-mining-job/1234567890')
                .expect('Content-Type', /json/)
                .expect(200)
                .then(function (res) {
                    const response = res.body;
                    assert.equal(response.minedBy, '1234567890');
                    assert.equal(response.difficulty, 4);
                    assert.equal(response.transactions.length, 2);
                    assert.equal(response.prevBlockhash, '232e447f6a0a065112b396aaa49cc52b0ff76c37cbd9169635992c207b8f10df');
                    assert.equal(response.transactions[0].from, '0000000000000000000000000000000000000000');
                    assert.equal(response.transactions[0].to, '1234567890');
                    assert.equal(response.transactions[0].value, 500000 + 10);
                    assert.equal(response.transactions[1].transactionDataHash, 'c901efc7864c6a94137e7a0f559610bc091fc362c314dc954ea76d22ee733f75');
                    done()
                })
        });
    });

    describe('/transactions/confirmed', function () {
        it('Should retrieve the confirmed transactions', function (done) {
            const candidateBlock = {
                index: 1,
                transactions: [{
                    from: '0000000000000000000000000000000000000000',
                    to: '492bceee1efc35da07362ba7f523a8ba45469b54',
                    value: 500000,
                    fee: 0,
                    dateCreated: '2018-06-18T15:57:33.698Z',
                    data: 'coinbase tx',
                    senderPubKey: '00000000000000000000000000000000000000000000000000000000000000000',
                    senderSignature: [Array],
                    minedInBlockIndex: 1,
                    transferSuccessful: true,
                    transactionDataHash: 'bbe643a48497c35b63592d9272548d0f4f3547cd8ac41feba23952b79944a5a5'
                }],
                difficulty: 4,
                prevBlockhash: '232e447f6a0a065112b396aaa49cc52b0ff76c37cbd9169635992c207b8f10df',
                minedBy: '492bceee1efc35da07362ba7f523a8ba45469b54',
                prevBlockHash: '232e447f6a0a065112b396aaa49cc52b0ff76c37cbd9169635992c207b8f10df',
                blockDataHash: 'e2f71a1e17f69b8b3b00ae48722710643efa726dbe88d4ec7da9d5a9351273a8',
                dateCreated: '2018-06-18T15:57:34.696Z',
                nonce: 21015,
                blockHash: '000056cbc949e184c70a8d45b990b250cce8d980f1b193bf027071fea64a9452'
            };
            burgerNode.chain.blocks.push(candidateBlock)

            request(server)
                .get('/transactions/confirmed')
                .expect('Content-Type', /json/)
                .expect(200)
                .then(function (res) {
                    const response = res.body;
                    assert.equal(JSON.stringify(response[1]), JSON.stringify(candidateBlock.transactions[0]));
                    done();
                })
        });
    });

    describe('/transactions/pending', function () {
        it('Should retrieve the pending transactions', function (done) {
            const pendingTransaction = {
                "from": "e9e12fe5c7d3330f83d7a374ca1bacc0cc730196",
                "to": "ef85b208900e7e29b4462b46b545939d9fe30ea2",
                "value": 100,
                "fee": 10,
                "dateCreated": "2018-06-18T16:16:03.552Z",
                "data": "",
                "senderPubKey": "7135be26422c9edf15ebb3076694f9acb5f6d37460b8352225863a32247b04fd1",
                "senderSignature": [
                    "eee2c19a30d4f650e0056f835b943522d53e8b9710fbdc33e2e6f1ff77cecd98",
                    "28a6ab889983511b958aa3f6d7543c439b2f181d4eeab5c2e600b593b4757503"
                ],
                "minedInBlockIndex": null,
                "transferSuccessful": null,
                "transactionDataHash": "c901efc7864c6a94137e7a0f559610bc091fc362c314dc954ea76d22ee733f75"
            }
            burgerNode.chain.pendingTransactions.push(pendingTransaction);

            request(server)
                .get('/transactions/pending')
                .expect('Content-Type', /json/)
                .expect(200, [pendingTransaction], done)
        });
    });

    describe('/transactions/send', function () {
        it('Should accept a valid transaction', function (done) {
            const transaction = {
                "from": "e9e12fe5c7d3330f83d7a374ca1bacc0cc730196",
                "to": "ef85b208900e7e29b4462b46b545939d9fe30ea2",
                "value": 100,
                "fee": 10,
                "dateCreated": "2018-06-18T16:16:03.552Z",
                "data": "",
                "senderPubKey": "7135be26422c9edf15ebb3076694f9acb5f6d37460b8352225863a32247b04fd1",
                "senderSignature": [
                    "eee2c19a30d4f650e0056f835b943522d53e8b9710fbdc33e2e6f1ff77cecd98",
                    "28a6ab889983511b958aa3f6d7543c439b2f181d4eeab5c2e600b593b4757503"
                ],
                "minedInBlockIndex": null,
                "transferSuccessful": null,
                "transactionDataHash": "c901efc7864c6a94137e7a0f559610bc091fc362c314dc954ea76d22ee733f75"
            }

            request(server)
                .post('/transactions/send')
                .send(transaction)
                .expect('Content-Type', /json/)
                .expect(
                    200, {
                        transactionDataHash: 'c901efc7864c6a94137e7a0f559610bc091fc362c314dc954ea76d22ee733f75'
                    },
                    done
                );
        });

        it('Should reject an invalid altered transaction', function (done) {
            const transaction = {
                "from": "e9e12fe5c7d3330f83d7a374ca1bacc0cc730196",
                "to": "ef85b208900e7e29b4462b46b545939d9fe30ea2",
                "value": 100,
                "fee": 10,
                "dateCreated": "2018-06-18T16:16:03.552Z",
                "data": "",
                "senderPubKey": "7135be26422c9edf15ebb3076694f9acb5f6d37460b8352225863a32247b04fd1",
                "senderSignature": [
                    /**
                     * Alterations are found here, original:
                     *  "eee2c19a30d4f650e0056f835b943522d53e8b9710fbdc33e2e6f1ff77cecd98",
                     *  "28a6ab889983511b958aa3f6d7543c439b2f181d4eeab5c2e600b593b4757503"
                     */
                    "0002c19a30d4f650e0056f835b943522d53e8b9710fbdc33e2e6f1ff77cecd98",
                    "0006ab889983511b958aa3f6d7543c439b2f181d4eeab5c2e600b593b4757503"
                ],
                "minedInBlockIndex": null,
                "transferSuccessful": null,
                "transactionDataHash": "c901efc7864c6a94137e7a0f559610bc091fc362c314dc954ea76d22ee733f75"
            }

            request(server)
                .post('/transactions/send')
                .send(transaction)
                .expect('Content-Type', /json/)
                .expect(
                    400, {
                        errorMsg: 'Invalid Transaction'
                    },
                    done
                );
        });
    });

    describe('/address/:address/balance', function () {
        it('Should return the balance of an address WITH existing balance', function (done) {
            request(server)
                .get('/address/e9e12fe5c7d3330f83d7a374ca1bacc0cc730196/balance')
                .expect('Content-Type', /json/)
                .expect(200, {
                    "safeBalance": 0,
                    "confirmedBalance": 1000000000000,
                    "pendingBalance": 1000000000000
                }, done)
        });

        it('Should return the balance of an address WITHOUT existing balance', function (done) {
            request(server)
                .get('/address/1234567890/balance')
                .expect('Content-Type', /json/)
                .expect(200, {
                    "safeBalance": 0,
                    "confirmedBalance": 0,
                    "pendingBalance": 0
                }, done)
        })

        it('Should return the balance of an address WITH pending balance only', function (done) {
            const pendingTransaction = {
                "from": "e9e12fe5c7d3330f83d7a374ca1bacc0cc730196",
                "to": "ef85b208900e7e29b4462b46b545939d9fe30ea2",
                "value": 100,
                "fee": 10,
                "dateCreated": "2018-06-18T16:16:03.552Z",
                "data": "",
                "senderPubKey": "7135be26422c9edf15ebb3076694f9acb5f6d37460b8352225863a32247b04fd1",
                "senderSignature": [
                    "eee2c19a30d4f650e0056f835b943522d53e8b9710fbdc33e2e6f1ff77cecd98",
                    "28a6ab889983511b958aa3f6d7543c439b2f181d4eeab5c2e600b593b4757503"
                ],
                "minedInBlockIndex": null,
                "transferSuccessful": null,
                "transactionDataHash": "c901efc7864c6a94137e7a0f559610bc091fc362c314dc954ea76d22ee733f75"
            }
            burgerNode.chain.pendingTransactions.push(pendingTransaction);

            request(server)
                .get('/address/ef85b208900e7e29b4462b46b545939d9fe30ea2/balance')
                .expect('Content-Type', /json/)
                .expect(200, {
                    "safeBalance": 0,
                    "confirmedBalance": 0,
                    "pendingBalance": 100
                }, done);
        });
    });

    describe('/address/:address/transactions', function () {
        it('Should return the transactions of an address WITH existing confirmed transactions only', function (done) {
            request(server)
                .get('/address/e9e12fe5c7d3330f83d7a374ca1bacc0cc730196/transactions')
                .expect('Content-Type', /json/)
                .expect(200, {
                    "address": "e9e12fe5c7d3330f83d7a374ca1bacc0cc730196",
                    "transactions": [{
                        "from": "0000000000000000000000000000000000000000",
                        "to": "e9e12fe5c7d3330f83d7a374ca1bacc0cc730196",
                        "value": 1000000000000,
                        "fee": 0,
                        "dateCreated": "2018-06-13T10:01:48.471Z",
                        "data": "The first burgers",
                        "senderPubKey": "00000000000000000000000000000000000000000000000000000000000000000",
                        "senderSignature": [
                            "0000000000000000000000000000000000000000000000000000000000000000",
                            "0000000000000000000000000000000000000000000000000000000000000000"
                        ],
                        "minedInBlockIndex": 0,
                        "transferSuccessful": true,
                        "transactionDataHash": "175f5ee0cd0e93b572729b09853f2cde411a9976abe39236dfbb9c8c7f319d4c"
                    }]
                }, done);
        });
        it('Should return the transactions of an address WITH existing pending transactions only', function (done) {
            const pendingTransaction = {
                "from": "e9e12fe5c7d3330f83d7a374ca1bacc0cc730196",
                "to": "ef85b208900e7e29b4462b46b545939d9fe30ea2",
                "value": 100,
                "fee": 10,
                "dateCreated": "2018-06-18T16:16:03.552Z",
                "data": "",
                "senderPubKey": "7135be26422c9edf15ebb3076694f9acb5f6d37460b8352225863a32247b04fd1",
                "senderSignature": [
                    "eee2c19a30d4f650e0056f835b943522d53e8b9710fbdc33e2e6f1ff77cecd98",
                    "28a6ab889983511b958aa3f6d7543c439b2f181d4eeab5c2e600b593b4757503"
                ],
                "minedInBlockIndex": null,
                "transferSuccessful": null,
                "transactionDataHash": "c901efc7864c6a94137e7a0f559610bc091fc362c314dc954ea76d22ee733f75"
            }
            burgerNode.chain.pendingTransactions.push(pendingTransaction);

            request(server)
                .get('/address/ef85b208900e7e29b4462b46b545939d9fe30ea2/transactions')
                .expect('Content-Type', /json/)
                .expect(200, {
                    "address": "ef85b208900e7e29b4462b46b545939d9fe30ea2",
                    "transactions": [pendingTransaction]
                }, done);
        });
        it('Should return the transactions of an address WITH existing pending and confirmed transactions', function (done) {
            const pendingTransaction = {
                "from": "e9e12fe5c7d3330f83d7a374ca1bacc0cc730196",
                "to": "ef85b208900e7e29b4462b46b545939d9fe30ea2",
                "value": 100,
                "fee": 10,
                "dateCreated": "2018-06-18T16:16:03.552Z",
                "data": "",
                "senderPubKey": "7135be26422c9edf15ebb3076694f9acb5f6d37460b8352225863a32247b04fd1",
                "senderSignature": [
                    "eee2c19a30d4f650e0056f835b943522d53e8b9710fbdc33e2e6f1ff77cecd98",
                    "28a6ab889983511b958aa3f6d7543c439b2f181d4eeab5c2e600b593b4757503"
                ],
                "minedInBlockIndex": null,
                "transferSuccessful": null,
                "transactionDataHash": "c901efc7864c6a94137e7a0f559610bc091fc362c314dc954ea76d22ee733f75"
            }

            const confirmedTransaction = {
                "from": "0000000000000000000000000000000000000000",
                "to": "e9e12fe5c7d3330f83d7a374ca1bacc0cc730196",
                "value": 1000000000000,
                "fee": 0,
                "dateCreated": "2018-06-13T10:01:48.471Z",
                "data": "The first burgers",
                "senderPubKey": "00000000000000000000000000000000000000000000000000000000000000000",
                "senderSignature": [
                    "0000000000000000000000000000000000000000000000000000000000000000",
                    "0000000000000000000000000000000000000000000000000000000000000000"
                ],
                "minedInBlockIndex": 0,
                "transferSuccessful": true,
                "transactionDataHash": "175f5ee0cd0e93b572729b09853f2cde411a9976abe39236dfbb9c8c7f319d4c"
            }

            burgerNode.chain.pendingTransactions.push(pendingTransaction);

            request(server)
                .get('/address/e9e12fe5c7d3330f83d7a374ca1bacc0cc730196/transactions')
                .expect('Content-Type', /json/)
                .expect(200, {
                    "address": "e9e12fe5c7d3330f83d7a374ca1bacc0cc730196",
                    "transactions": [pendingTransaction, confirmedTransaction]
                }, done);
        });
        it('Should return an error from an address without a transaction', function (done) {
            request(server)
                .get('/address/1234567890/transactions')
                .expect('Content-Type', /json/)
                .expect(404, {
                    errorMsg: "Invalid address"
                }, done);
        });
    });

    describe('/transactions/:transactionDataHash', function () {
        it('Should return the full transaction data of an existing transaction data hash', function (done) {
            request(server)
                .get('/transactions/175f5ee0cd0e93b572729b09853f2cde411a9976abe39236dfbb9c8c7f319d4c')
                .expect('Content-Type', /json/)
                .expect(200, {
                    "from": "0000000000000000000000000000000000000000",
                    "to": "e9e12fe5c7d3330f83d7a374ca1bacc0cc730196",
                    "value": 1000000000000,
                    "fee": 0,
                    "dateCreated": "2018-06-13T10:01:48.471Z",
                    "data": "The first burgers",
                    "senderPubKey": "00000000000000000000000000000000000000000000000000000000000000000",
                    "senderSignature": [
                        "0000000000000000000000000000000000000000000000000000000000000000",
                        "0000000000000000000000000000000000000000000000000000000000000000"
                    ],
                    "minedInBlockIndex": 0,
                    "transferSuccessful": true,
                    "transactionDataHash": "175f5ee0cd0e93b572729b09853f2cde411a9976abe39236dfbb9c8c7f319d4c"
                }, done);
        });
        it('Should return an error when the queried transaction data hash does not exist', function (done) {
            request(server)
                .get('/transactions/123456')
                .expect('Content-Type', /json/)
                .expect(404, {
                    errorMsg: "Invalid address"
                }, done);
        });
    });

    describe('/peers', function () {
        it('Should return the peers of a node', function (done) {
            burgerNode.nodes = {
                'test-id': 'test-address'
            };
            request(server)
                .get('/peers')
                .expect('Content-Type', /json/)
                .expect(200, {
                    'test-id': 'test-address'
                }, done);
        });
    });

    describe('/peers/connect', function () {
        it('Should add the peer to the list', function (done) {
            this.timeout(8000);

            /**
             * I have no idea how to launch two server instances within mocha
             * so I just used the remote app instance.
             */
            request(server)
                .post('/peers/connect')
                .send({
                    peer: 'http://mccoin.herokuapp.com'
                })
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .then(function (res) {

                    /**
                     * I'm having trouble properly testing the async-ness
                     * of websockets. For the interest of time, setTimeout()
                     * gets the job done.
                     */
                    setTimeout(function() {
                        const response = res.body;
                        assert.equal(response.message, 'Connected to peer: http://mccoin.herokuapp.com');
                        assert.equal(Object.values(burgerNode.nodes).length, 1);
                        JSON.stringify(burgerNode.nodes);
                        assert.equal(Object.values(burgerNode.nodes)[0], 'mccoin.herokuapp.com');
                        done();
                    }, 5000);
                });
        });
    });

    afterEach(function (done) {
        server.close(done);
    });
});

/**
 * Note: Mocha will not terminate automatically,
 * this is the intended behavior: https://github.com/chaijs/chai-http/issues/178
 */