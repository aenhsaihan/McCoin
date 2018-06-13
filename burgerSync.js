const WebSocket = require("ws");
const requester = require('request-promise');

class BurgerSync {
    constructor(port, burgerNode) {
        this.burgerNode = burgerNode;

        this.peers = {};
        this.MESSAGE_TYPE = {
            INITIAL_HANDSHAKE_QUERY: 0,
            INITIAL_HANDSHAKE_RESPONSE: 1,
            REQUEST_SYNC_CHAIN: 2,
            RESPONSE_SYNC_CHAIN: 3,
            BROADCAST_NEW_BLOCK: 4,
            BROADCAST_NEW_TRANSACTION: 5
        }

        this.webSocket = new WebSocket.Server({ port });
        this.webSocket.on('connection', this.initializeConnection.bind(this));
        this._printMessage('P2P IS LISTENING ON PORT ' + port);
    }

    async connect(newPeer) {
        var options = {
            uri: 'http://' + newPeer + '/info',
            json: true
        };
        
        const info = await requester(options);

        if (Object.keys(this.peers).includes(info.nodeId)) {
            throw new Error('Error: Already connected to peer!');
        }
        
        const newPeerWebSocket = new WebSocket('ws://' + info.nodeUrl);
        newPeerWebSocket.on('open', () => {
            this.addPeer(info.nodeId, newPeerWebSocket);
            this.initializeConnection(newPeerWebSocket);
        });
    }

    addPeer(nodeId, peer) {
        this._printMessage('Peer added to list...')
        this.peers[nodeId] = peer;
        this.burgerNode.nodes[nodeId] = this._getInternalQualifiedName(peer);
    }

    initializeConnection(peer) {
        this._printMessage('Peer Connected: ' + this._getInternalQualifiedName(peer));
        this._write(peer, this.MESSAGE_TYPE.INITIAL_HANDSHAKE_QUERY, 'Hello!');
        peer.on('close', () => {
            this.initializeErrorHandler(peer);
        });
        peer.on('error', () => {
            this.initializeErrorHandler(peer);
        });
        peer.on('message', (message) => {
            this.initializeMessageHandler(peer, message);
        });
    }

    initializeMessageHandler(peer, rawMessage) {
        let transmission = JSON.parse(rawMessage);
        let message = transmission.message;

        switch(transmission.type) {
            case this.MESSAGE_TYPE.INITIAL_HANDSHAKE_QUERY: 
                this._printMessage('Initial handshake Sent!')
                this._write(peer, this.MESSAGE_TYPE.INITIAL_HANDSHAKE_RESPONSE, this.burgerNode.info);
                break; 
            case this.MESSAGE_TYPE.INITIAL_HANDSHAKE_RESPONSE: 
                this._printMessage('Initial handshake received!');
                if (message.cumulativeDifficulty > this.burgerNode.info.cumulativeDifficulty) {
                    this._printMessage('Peer chain is better, requesting sync...');
                    this._write(peer, this.MESSAGE_TYPE.REQUEST_SYNC_CHAIN, 'Let us sync!');
                }
                break;
            case this.MESSAGE_TYPE.REQUEST_SYNC_CHAIN:
                this._printMessage('Sync request received! Sending chain...')
                this._write(peer, this.MESSAGE_TYPE.RESPONSE_SYNC_CHAIN, this.burgerNode.chain);
                break;
            case this.MESSAGE_TYPE.RESPONSE_SYNC_CHAIN:
                this._printMessage('Chain received! Syncing...')
                this.burgerNode.replaceChain(message);
                this._printMessage('    Synced!');
                break;
            case this.MESSAGE_TYPE.BROADCAST_NEW_BLOCK:
                this._printMessage('A new block has been mined!');
                if (message.cumulativeDifficulty > this.burgerNode.info.cumulativeDifficulty) {
                    this.burgerNode.replaceChain(message);
                    this.broadcastNewBlock(message);
                }
                break;
            case this.MESSAGE_TYPE.BROADCAST_NEW_TRANSACTION:
                this._printMessage('Processing new broadcasted transaction...');
                this._printMessage('    Not added to chain!')
                const isValid = this.burgerNode.addPendingTransaction(message);
                if (isValid) {
                    this.burgerNode.addPendingTransaction(message);
                    this._broadcast(this.MESSAGE_TYPE.BROADCAST_NEW_TRANSACTION, message);
                    this._printMessage('    Added to pending transactions!');
                }
                break;
        }
    }

    broadcastNewTransaction(transaction) {
        this._broadcast(this.MESSAGE_TYPE.BROADCAST_NEW_TRANSACTION, transaction);
    }

    broadcastNewBlock(chain) {
        this._broadcast(this.MESSAGE_TYPE.BROADCAST_NEW_BLOCK, chain);
    }

    initializeErrorHandler(peer) {
        this._printMessage('Connection Failed to ' + this._getInternalQualifiedName(peer));
        this._removePeer(peer);
    }

    _write(webSocket, type, message) {
        const transmission = { type, message };
        webSocket.send(JSON.stringify(transmission));
    }

    _broadcast(type, message) {
        this._getPeers().forEach(function(peer) {
            this._write(peer, type, message);
        }.bind(this));
    }

    _printMessage(message) {
        console.log(`[${new Date().toISOString()}] ${message}`);
    }

    _getInternalQualifiedName(peer) {
        return peer._socket.remoteAddress + ":" + peer._socket.remotePort;
    }

    _removePeer(value) {
        const peerIndex = Object.values(this.peers).indexOf(value);
        const peer = Object.keys(this.peers)[peerIndex];
        delete this.peers[peer];
        delete this.burgerNode.nodes[peer];       
    }

    _getPeers() {
        return Object.values(this.peers);
    }
}

module.exports = BurgerSync;