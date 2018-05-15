const express = require('express')
const BurgerBlockchain = require('./burgerBlockchain')
const BurgerNode = require('./burgerNode')
var bodyParser = require('body-parser');
var WebSocket = require("ws");

const app = express();
app.use(bodyParser.json());

var http_port = process.env.HTTP_PORT || 3001;
var p2p_port = process.env.P2P_PORT || 6001;
var initialPeers = process.env.PEERS ? process.env.PEERS.split(',') : [];

var sockets = [];

var MessageType = {
    QUERY_LATEST: 0,
    QUERY_ALL: 1,
    RESPONSE_BLOCKCHAIN: 2
};

const burgerBlockchain = new BurgerBlockchain()
const burgerNode = new BurgerNode(burgerBlockchain)

const config = {
    host: "localhost",
    port: http_port,
    websocketPort: p2p_port,
    selfUrl: "http://localhost" + ":" + http_port,
    webSocketUrl: "ws://localhost" + ":" + p2p_port,
    todo: "IMPLEMENTATION PENDING"
}

const initializeServer = () => {
    app.listen(http_port, () => console.log('Listening http on port: ' + http_port))
}

app.get('/', (request, response) => {
    response.send('SANITY CHECKS')
})

app.get('/blocks', (request, response) => {
    response.json(burgerNode.getBlocks())
})

app.get('/blocks/:index', (request, response) => {
    const index = request.params.index
    const block = burgerNode.findBlockByIndex(index)
    response.json(block)
})

app.post('/mining/submit-mined-block', (request, response) => {
    const newBlock = burgerNode.createNewBlock(0, 0);
    console.log('block added: ' + JSON.stringify(newBlock));
    response.send();
})

app.get('/peers', (req, res) => {
    res.send(burgerNode.nodes);
})

app.post('/peers/connect', (req, res) => {
    connectToPeers([req.body.peer]);
    res.send("Success", 200);
})

app.get('/debug', (req, res) => {
    res.json({
        "node": burgerNode,
        "config": config
    });
})

var initP2PServer = () => {
    var server = new WebSocket.Server({ port: p2p_port });
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
                //handleBlockchainResponse(message);
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

var queryChainLengthMsg = () => ({ 'type': MessageType.QUERY_LATEST });
var queryAllMsg = () => ({ 'type': MessageType.QUERY_ALL });

var responseChainMsg = () => ({
    'type': MessageType.RESPONSE_BLOCKCHAIN,
    'data': "blockchain parsed"
});
var responseLatestMsg = () => ({
    'type': MessageType.RESPONSE_BLOCKCHAIN,
    'data': " No Data For getLatestBlock"
});

var write = (ws, message) => ws.send(JSON.stringify(message));
var broadcast = (message) => burgerNode.nodes.forEach(socket => write(socket, message));

initializeServer()
connectToPeers(initialPeers);
initP2PServer();