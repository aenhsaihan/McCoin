const express = require('express')
const path = require('path');
const BurgerBlockchain = require('./burgerBlockchain')
const BurgerNode = require('./burgerNode')
const BurgerMiner = require('./burgerMiner')
const BurgerFaucet = require('./burgerFaucet');
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
    selfUrl: `http://${hostName}:${http_port}`,
    webSocketUrl: `ws://${hostName}:${p2p_port}`
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
    broadcast(responseLatestMsg());
    response.send();
})

app.get('/mining/get-mining-job/:address', (request, response) => {
    const minerAddress = request.params.address;
    const information = burgerNode.chain.prepareCandidateBlock(minerAddress);
    response.json(information);
})
app.get('/transactions/confirmed',(req, res) => {
    const confirmedTransactions = burgerNode.pullConfirmedTransactions();
    res.json(confirmedTransactions)
})
app.get('/transactions/pending',(req, res) => {

    res.json(burgerNode.chain.pendingTransactions)
})
app.post('/transactions/send', (req, res) => {
    //take in transaction object
    //need to validate later <<<<---------------REMINDER!!!!!! --------------<<<<<<<<<---------
    const response = addTransactionToNode(req.body);
    if (response) {
        broadcast(responseChainMsg());
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
    if(peerExists(req.body.peer)){
        res.status(400).send("FAILED: Peer already exists on the node!");
    }
    else{
        connectToPeers([req.body.peer])
        res.status(200).send("Success");
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

var addTransactionToNode = (transaction) => {
    return burgerNode.addPendingTransaction(transaction);
}

app.get('/debug/reset-chain', (req, res) => {
    burgerNode.resetChain();
    res.json({
        message: "The chain was reset to its genesis block"
    });
})

var initP2PServer = () => {
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

};

var peerExists = (peer) =>{

    for(i = 0; i < sockets.length; i++){
        if(sockets[i].url === peer){
            return true;
        }
    }
    return false;
}

var handleBlockchainResponse = message => {

    var receivedChain = JSON.parse(message.data);
    receivedChain = new BurgerBlockchain(receivedChain.pendingTransactions, receivedChain.currentDifficulty, receivedChain.blocks);
    var latestBlockReceived = receivedChain.getLastBlock();
    var latestBlockHeld = burgerNode.chain.getLastBlock();
    if (latestBlockReceived.index > latestBlockHeld.index) {
        console.log(
            'blockchain possibly behind. We got: ' +
            latestBlockHeld.index +
            ' Peer got: ' +
            latestBlockReceived.index
        );
        if (latestBlockHeld.hash === latestBlockReceived.previousHash) {
            console.log('We can append the received block to our chain');
            burgerNode.replaceChain(receivedChain);
            broadcast(responseLatestMsg());
        } else if (receivedBlocks.length === 1) {
            console.log('We have to query the chain from our peer');
            broadcast(queryAllMsg());
        } else {
            console.log('Received blockchain is longer than current blockchain');
            burgerNode.replaceChain(receivedChain);
        }
    } else {
        if (receivedChain.pendingTransactions) {
            if (receivedChain.pendingTransactions.length > burgerNode.chain.pendingTransactions.length) {
                console.log("updating the chain to match current pending Transactions");
                burgerNode.replaceChain(receivedChain);
            } else if (receivedChain.pendingTransactions.length < burgerNode.chain.pendingTransactions.length) {
                console.log('We have to query the chain from our peer because the transactions dont make sence');
                broadcast(queryAllMsg());
            } else {
                console.log('The Pending Transactions lists are equal');
            }
        }
        console.log(
            'received blockchain is not longer than current blockchain. Do nothing'
        );
    }
};

var queryChainLengthMsg = () => ({
    'type': MessageType.QUERY_LATEST
});
var queryAllMsg = () => ({
    'type': MessageType.QUERY_ALL
});

var responseChainMsg = () => ({
    'type': MessageType.RESPONSE_BLOCKCHAIN,
    'data': JSON.stringify(burgerNode.chain)
});
var responseLatestMsg = () => ({
    'type': MessageType.RESPONSE_BLOCKCHAIN,
    'data': JSON.stringify(burgerNode.chain)
});

var write = (ws, message) => ws.send(JSON.stringify(message));
var broadcast = (message) => sockets.forEach(socket => write(socket, message));

initializeServer()
connectToPeers(initialPeers);
initP2PServer();
