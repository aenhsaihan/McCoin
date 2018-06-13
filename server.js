const express = require('express')
const path = require('path');
const http = require('http');

const BurgerBlockchain = require('./burgerBlockchain')
const BurgerNode = require('./burgerNode')
const BurgerFaucet = require('./burgerFaucet');
const BurgerSync = require('./burgerSync');

var bodyParser = require('body-parser');
var cors = require('cors');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(bodyParser.json());

const hostName = process.env.HOST || 'localhost';
var http_port = process.env.HTTP_PORT || 3001;
var initialPeers = process.env.PEERS ? process.env.PEERS.split(',') : [];

let burgerSync;

const config = {
    host: hostName,
    port: http_port,
    selfUrl: `${hostName}:${http_port}`,
};

const burgerNode = new BurgerNode(new BurgerBlockchain(), config);

app.use('/', express.static(path.resolve('public')));

app.get('/info', (request, response) => {
    response.json(burgerNode.info);
});

app.get('/blocks', (request, response) => {
    response.json(burgerNode.getBlocks())
})

app.get('/blocks/:index', (request, response) => {
    const index = request.params.index
    const block = burgerNode.findBlockByIndex(index)
    response.json(block) 
})

app.post('/mining/submit-mined-block', (request, response) => {
    burgerNode.addMinedBlock(request.body);
    burgerSync.broadcastNewBlock(burgerNode.chain);
    response.send();
})

app.get('/mining/get-mining-job/:address', (request, response) => {
    const minerAddress = request.params.address;
    const information = burgerNode.chain.prepareCandidateBlock(minerAddress);
    response.json(information);
})
app.get('/transactions/confirmed',(req, res) => {
    const confirmedTransactions =  burgerNode.pullConfirmedTransactions();
    res.json(confirmedTransactions)
})
app.get('/transactions/pending',(req, res) => {

    res.json(burgerNode.chain.pendingTransactions)
})
app.post('/transactions/send', (req, res) => {
    const transaction = req.body;
    const isTransactionValid = burgerNode.addPendingTransaction(req.body);
    if (isTransactionValid) {
        burgerSync.broadcastNewTransaction(transaction);
        res.send("Transaction accepted!");
    } else {
        res.send("TRANSACTION REJECTED");
    }
})

app.get('/address/:address/balance', (req, res) => {
    const address = req.params.address;

    const safeBalance = burgerNode.getSafeBalanceOfAddress(address);
    const confirmedBalance = burgerNode.getConfirmedBalanceOfAddress(address);
    const pendingBalance = burgerNode.getPendingBalanceOfAddress(address);

    res.json({
        safeBalance,
        confirmedBalance: parseFloat(confirmedBalance),
        pendingBalance
    });
})

app.get('/address/:address/transactions', (req, res) => {
    const address = req.params.address;
    res.json(burgerNode.getTransactionsOfAddress(address));
});

app.get('/transactions/:transactionDataHash', (req, res) => {
    const transactionDataHash = req.params.transactionDataHash;
    res.json(burgerNode.getTransaction(transactionDataHash));
});

app.get('/peers', (req, res) => {
    res.send(burgerNode.nodes);
})

app.post('/peers/connect', async (req, res) => {
    try {
        await burgerSync.connect(req.body.peer);
        res.status(200).send('Success!');
    } catch(e) {
        res.status(400).send(e.message);
    }
})

app.get('/faucet/:address/:burgers', async (req, res) => {
  const address = req.params.address;
  const burgers = req.params.burgers;
  await BurgerFaucet.sendBurgers(address, burgers);
  res.send("Request accepted!");
});

app.get('/debug', (req, res) => {
    res.json({
        "node": burgerNode,
        "config": config,
    });
})

app.get('/debug/reset-chain', (req, res) => {
    burgerNode.resetChain();
    res.json({
        message: "The chain was reset to its genesis block"
    });
})

const initializeServer = () => {
    burgerSync = new BurgerSync(server, burgerNode);
    server.listen(http_port, () => console.log('HTTP and P2P is listening on port: ' + http_port));
}

initializeServer();