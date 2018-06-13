const WebSocket = require("ws");
const requester = require('request-promise');

class BurgerSync {
    constructor(server, burgerNode) {
        this.burgerNode = burgerNode;

        this.peers = {};
        this.MESSAGE_TYPE = {
            INITIAL_HANDSHAKE_QUERY: 0,
            INITIAL_HANDSHAKE_RESPONSE: 1,
            REQUEST_SYNC_CHAIN: 2,
            RESPONSE_SYNC_CHAIN: 3,
            BROADCAST_NEW_BLOCK: 4,
            BROADCAST_NEW_TRANSACTION: 5,
            REQUEST_SYNC_PENDING_TRANSACTIONS: 6,
            RESPONSE_SYNC_PENDING_TRANSACTIONS: 7,
            INVALID_REQUEST: 8
        }

        this.webSocket = new WebSocket.Server({ server });
        this.webSocket.on('connection', this.initializeConnection.bind(this)); 
    }

    /**
     * Connects and gets the information of a peer
     * via the /info REST endpoint.
     * 
     * Will not connect if the node is currently
     * connected to the intended peer.
     * 
     * @param {url} newPeer - the (http) URL of the peer
     */
    async connect(newPeer) {
        const options = {
            uri: newPeer + '/info',
            json: true
        };

        let info = await requester(options);

        if (Object.keys(this.peers).includes(info.nodeId)) {
            throw new Error('Error: Already connected to peer!');
        }

        const newPeerWebSocket = new WebSocket('ws://' + info.nodeUrl);
        newPeerWebSocket.on('open', () => {
            this.initializeConnection(newPeerWebSocket);
        });
    }

    /**
     * Adds the peer to the (nodeId => websocket) map.
     * 
     * @param {string} nodeId - the NodeID of the peer
     * @param {string} nodeUrl - the NodeURL of the peer
     * @param {websocket} peer - the socket connection object to the peer
     */
    addPeer(nodeId, nodeUrl, webSocket) {
        this._printMessage('Peer added to list...')
        this.peers[nodeId] = webSocket;
        this.burgerNode.nodes[nodeId] = nodeUrl;
    }

    /**
     * The node initializes the websocket connection to 
     * the peer and gets itself ready via the following steps:
     * 
     * 1 - Send a handshake to the peer announcing that it wants
     *      to check /info and possibly sync if the peer's chain
     *      is better.
     * 2 - Initializes the close, error, and message event handlers.
     * 
     * @param {websocket} peer - the socket connection object to the peer
     */
    initializeConnection(peer) { 
        this._printMessage('Connecting to peer (' + this._getInternalQualifiedName(peer) + ')...');
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

    /**
     * Handles the messages received from the websockets.
     * For the uniformity of the messages, this schema
     * is followed:
     * 
     * schema = {
     *      type: this.MESSAGE_TYPE[the-message-type],
     *      message: the message object
     * }
     * 
     * Usage of burgerSync._write() method is recommended
     * to send message.
     * 
     * @param {websocket} peer - the socket connection object to the peer
     * @param {object} rawMessage - the message received on the socket
     */
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
                if (message.chainId !== this.burgerNode.info.chainId) {
                    this._printMessage('Chain ID mismatch!');
                    this._printMessage('    Node chain ID: ' + this.burgerNode.info.chainId);
                    this._printMessage('    Peer chain ID: ' + message.chainId);
                    this._printMessage('    PEER NODE REJECTED!');
                    return;
                }

                this.addPeer(message.nodeId, message.nodeUrl, peer);

                if (message.cumulativeDifficulty > this.burgerNode.info.cumulativeDifficulty) {
                    this._printMessage('Peer chain is better, requesting sync...');
                    this._write(peer, this.MESSAGE_TYPE.REQUEST_SYNC_CHAIN, 'Let us sync the whole chain!');
                    return;
                }
                if (message.pendingTransactions > 0) { 
                    this._printMessage('Peer chain got pending transactions, requesting sync...');
                    this._write(peer, this.MESSAGE_TYPE.REQUEST_SYNC_PENDING_TRANSACTIONS, 'Let us sync the pending transactions!');
                    return;
                }
                this._printMessage('    Chain and pending transactions are equal.');
                this._printMessage('    Got nothing to do...');
                break;
            case this.MESSAGE_TYPE.REQUEST_SYNC_CHAIN:
                this._printMessage('Chain sync request received! Sending chain...')
                this._write(peer, this.MESSAGE_TYPE.RESPONSE_SYNC_CHAIN, this.burgerNode.chain);
                break;
            case this.MESSAGE_TYPE.REQUEST_SYNC_PENDING_TRANSACTIONS:
                this._printMessage('Pending transactions sync request received! Sending transactions...')
                this._write(peer, this.MESSAGE_TYPE.RESPONSE_SYNC_PENDING_TRANSACTIONS, this.burgerNode.chain.pendingTransactions);
                break;
            case this.MESSAGE_TYPE.RESPONSE_SYNC_PENDING_TRANSACTIONS:
                this._printMessage('Pending transactions received! Syncing...')
                this.burgerNode.appendPendingTransactions(message);
                this._reBroadcast(peer, this.MESSAGE_TYPE.RESPONSE_SYNC_PENDING_TRANSACTIONS, message);
                this._printMessage('    Synced!');
                break; 
            case this.MESSAGE_TYPE.RESPONSE_SYNC_CHAIN:
                /**
                 * When chain is synced, only sync the "blocks" instead of
                 * the whole blockchain instance.  
                 */
                this._printMessage('Chain received! Syncing...')
                this.burgerNode.replaceChain(message);
                this._reBroadcast(peer, this.MESSAGE_TYPE.RESPONSE_SYNC_CHAIN, message);
                this._broadcast(this.MESSAGE_TYPE.RESPONSE_SYNC_PENDING_TRANSACTIONS, this.burgerNode.chain.pendingTransactions);
                this._printMessage('    Synced!'); 
                break;
            case this.MESSAGE_TYPE.BROADCAST_NEW_BLOCK:
                this._printMessage('A new block has been mined!');
                if (message.cumulativeDifficulty > this.burgerNode.info.cumulativeDifficulty) {
                    this.burgerNode.replaceChain(message);
                    this._reBroadcast(peer, this.MESSAGE_TYPE.BROADCAST_NEW_BLOCK, message);
                }
                break;
            case this.MESSAGE_TYPE.BROADCAST_NEW_TRANSACTION:
                this._printMessage('Processing new broadcasted transaction...');
                const isValid = this.burgerNode.addPendingTransaction(message);
                if (isValid) {
                    this.burgerNode.addPendingTransaction(message);
                    this._reBroadcast(peer, this.MESSAGE_TYPE.BROADCAST_NEW_TRANSACTION, message);
                    this._printMessage('    Added to pending transactions!');
                } else {
                    this._printMessage('    Not added to chain!')
                }
                break;
            default:
                this._write(peer, this.MESSAGE_TYPE.INVALID_REQUEST, 'REJECTED: Got invalid request!')
        }
    }

    /**
     * Broadcasts a new transaction to all connected peers.
     * 
     * @param {burgerTransaction} transaction 
     */
    broadcastNewTransaction(transaction) {
        this._broadcast(this.MESSAGE_TYPE.BROADCAST_NEW_TRANSACTION, transaction);
    }

    /**
     * Broadcasts a new block to all connected peers.
     * This event happens when a new block is mined.
     * 
     * @param {burgerBlockchain} chain 
     */
    broadcastNewBlock(chain) {
        this._broadcast(this.MESSAGE_TYPE.BROADCAST_NEW_BLOCK, chain);
    }

    /**
     * Removes the peer from the (nodeId => websocket) map.
     * 
     * @param {websocket} peer - the socket connection object to the peer
     */
    initializeErrorHandler(peer) {
        this._printMessage('Connection Failed to ' + this._getInternalQualifiedName(peer));
        this._removePeer(peer);
    }

    // Private methods ================

    /**
     * Sends a message to a single peer.
     * 
     * @param {websocket} peer - the socket connection object to the peer.
     * @param {burgerSync.MESSAGE_TYPE} type - the message type (from burgerSync.MESSAGE_TYPE).
     * @param {object} message - the message to be sent
     */
    _write(peer, type, message) {
        const transmission = { type, message };
        peer.send(JSON.stringify(transmission));
    }

    /**
     * Broadcasts a message to all connected peers.
     * 
     * @param {burgerSync.MESSAGE_TYPE} type - the message type (from burgerSync.MESSAGE_TYPE).
     * @param {object} message - the message to be sent
     */
    _broadcast(type, message) {
        this._getPeers().forEach(function(peer) {
            this._write(peer, type, message);
        }.bind(this));
    }

    /**
     * Rebroadcasts the message to all connected peers EXCEPT
     * the source peer to prevent a notification loop from happening
     * 
     * @param {*} sourcePeer - the peer to exclude from the broadcast
     * @param {burgerSync.MESSAGE_TYPE} type - the message type (from burgerSync.MESSAGE_TYPE).
     * @param {object} message - the message to be sent
     */
    _reBroadcast(sourcePeer, type, message) {
        this._getPeers().forEach(function(peer) {
            if (this._getInternalQualifiedName(peer) !== this._getInternalQualifiedName(sourcePeer)) {
                this._write(peer, type, message);
            }
        }.bind(this));
    }

    /**
     * Prints a log on the console.
     * 
     * @param {string} message 
     */
    _printMessage(message) {
        console.log(`[${new Date().toISOString()}] ${message}`);
    }

    /**
     * Gets the [remoteAddress:port] string of a websocket connection
     * object for whatever purpose it may serve us best. :D
     * 
     * @param {*} peer 
     */
    _getInternalQualifiedName(peer) {
        return peer._socket.remoteAddress + ":" + peer._socket.remotePort;
    }

    /**
     * Removes a peer from the (nodeId => websocket) map.
     * 
     * @param {url} peerSocketInstance - the peer websocket instance
     */
    _removePeer(peerSocketInstance) {
        this._printMessage('    Peer ' + this._getInternalQualifiedName(peerSocketInstance) + ' dropped.');
        const peerIndex = Object.values(this.peers).indexOf(peerSocketInstance);
        const peer = Object.keys(this.peers)[peerIndex];
        delete this.peers[peer];
        delete this.burgerNode.nodes[peer];       
    }

    /**
     * Retrieves all websocket instances from the (nodeId => websocket) map.
     */
    _getPeers() {
        return Object.values(this.peers);
    }
}

module.exports = BurgerSync;