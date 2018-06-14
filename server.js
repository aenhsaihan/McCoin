const express = require('express')
const path = require('path');
const BurgerBlockchain = require('./burgerBlockchain')
const BurgerNode = require('./burgerNode')
const BurgerMiner = require('./burgerMiner')
const BurgerFaucet = require('./burgerFaucet');
const BurgerSync = require('./burgerSync');

var bodyParser = require('body-parser');
var WebSocket = require("ws");
var cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const hostName = process.env.HOST || 'localhost';
var http_port = process.env.HTTP_PORT || 3001;
var p2p_port = process.env.P2P_PORT || 6001;
var initialPeers = process.env.PEERS ? process.env.PEERS.split(',') : [];

let burgerSync;

var sockets = [];

var MessageType = {
    QUERY_LATEST: 0,
    QUERY_ALL: 1,
    RESPONSE_BLOCKCHAIN: 2
};

const config = {
    host: hostName,
    port: http_port,
    websocketPort: p2p_port,
    selfUrl: `${hostName}:${p2p_port}`,
};

const burgerNode = new BurgerNode(new BurgerBlockchain(), config);

const initializeServer = () => {
    app.listen(http_port, () => console.log('Listening http on port: ' + http_port))
}

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
<<<<<<< HEAD
    const confirmedTransactions = burgerNode.pullConfirmedTransactions();
=======
    const confirmedTransactions =  burgerNode.pullConfirmedTransactions();
>>>>>>> e28b3cf28080fcb34ff03b45c41d40791d6cfcfe
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

app.post('/peers/connect', (req, res) => {
    try {
        burgerSync.connect(req.body.peer);
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
        "candidateBlock": burgerNode.chain.prepareCandidateBlock('0000000000000000000001')
    });
})

app.get('/debug/reset-chain', (req, res) => {
    burgerNode.resetChain();
    res.json({
        message: "The chain was reset to its genesis block"
    });
})

var initP2PServer = () => {
<<<<<<< HEAD
    var server = new WebSocket.Server({
        port: p2p_port
    });
    server.on('connection', ws => initConnection(ws));
    console.log('listening websocket p2p port on: ' + p2p_port);
};

var initConnection = (ws) => {
    sockets.push(ws);
    burgerNode.nodes = sockets.map(s => s._socket.remoteAddress + ":" + s._socket.remotePort);
    initMessageHandler(ws);
    initErrorHandler(ws);
    write(ws, queryChainLengthMsg());
};



var initMessageHandler = (ws) => {
    ws.on('message', (data) => {
        var message = JSON.parse(data);
        console.log('Received message' + JSON.stringify(message));
        switch (message.type) {
            case MessageType.QUERY_LATEST:
                write(ws, responseLatestMsg());
                break;
            case MessageType.QUERY_ALL:
                write(ws, responseChainMsg());
                break;
            case MessageType.RESPONSE_BLOCKCHAIN:
                handleBlockchainResponse(message);
                break;
        }
    });
};

var initErrorHandler = (ws) => {
    var closeConnection = (ws) => {
        console.log('connection failed to peer: ' + ws.url);
        sockets.splice(sockets.indexOf(ws), 1);
        burgerNode.nodes = sockets.map(s => s._socket.remoteAddress + ":" + s._socket.remotePort);
    };
    ws.on('close', () => closeConnection(ws));
    ws.on('error', () => closeConnection(ws));
};

var connectToPeers = (newPeers) => {
    newPeers.forEach((peer) => {
        const ws = new WebSocket(peer);
        ws.on('open', () => initConnection(ws));
        ws.on('error', () => {
            console.log('connection failed')
        });

    });

=======
    burgerSync = new BurgerSync(p2p_port, burgerNode);
>>>>>>> e28b3cf28080fcb34ff03b45c41d40791d6cfcfe
};

initializeServer()
initP2PServer();
