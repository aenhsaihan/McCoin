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

const REMOTE_HOST = process.env.REMOTE_HOST;
const HOST_NAME = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 3001;
var initialPeers = process.env.PEERS ? process.env.PEERS.split(',') : [];

let burgerSync;

const config = {
    host: HOST_NAME,
    port: PORT,
    selfUrl: REMOTE_HOST || `${HOST_NAME}:${PORT}`,
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
    if(burgerNode.chain.length > index){
        const block = burgerNode.findBlockByIndex(index)
        response.json(block).status(200);
    }else{
        response.json({
            "errorMsg": "Invalid block index"
        }).status(404);
    }
})

app.post('/mining/submit-mined-block', (request, response) => {
   let minedRes = burgerNode.addMinedBlock(request.body);
    burgerSync.broadcastNewBlock(burgerNode.chain);
    if(minedRes[0]){
        response.json({
            "message":minedRes[1]
        }).status(200);
    }else{
        if(minedRes[1]==="Block not found or already mined"){
            response.json({
                "errorMsg":minedRes[1]
            }).status(404);
        }else{
            response.json({
                "errorMsg":minedRes[1]
            }).status(404);
        }
    }
    
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
        res.json({
            "transactionDataHash":transaction.transactionDataHash
        }).status(200);
    } else {
        res.json({
            "errorMsg":"Invalid Transaction"
        }).status(404);
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
        }).status(200);
    

})

app.get('/address/:address/transactions', (req, res) => {
    const address = req.params.address;
    if(burgerNode.chain.getTransactionsOfAddress(address).transactions.length > 0){
       res.json(burgerNode.getTransactionsOfAddress(address)).status(200);
    }
    else{
        res.json({
            "errorMsg":"Invalid address"
        }).status(404);
    }

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
        res.status(200).json({
            "message":
      "Connected to peer: "+req.body.peer
        });
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
    server.listen(PORT, () => console.log('HTTP and P2P is listening on port: ' + PORT));
}


initializeServer();