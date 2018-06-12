const SHA256 = require('crypto-js/sha256');

class HashProvider {
    static calculateBlockHash(block) {
        const keys = Object.keys(block);
        if ( !(keys.includes('blockDataHash') && keys.includes('dateCreated') && keys.includes('nonce')) ) {
            throw new Error('Keys ' + keys + ' are not valid!');
        }
        return SHA256(block.blockDataHash + '|' + block.dateCreated + '|' + block.nonce).toString();
    }

    static calculateBlockDataHash(block) {
        const validKeys = ['index', 'transactions', 'difficulty', 'prevBlockHash', 'minedBy'];
        const actualKeys = Object.keys(block);
        if (JSON.stringify(validKeys) !== JSON.stringify(actualKeys)) {
            throw new Error('Keys ' + actualKeys + ' are not valid!');
        }
        return SHA256(JSON.stringify(block)).toString();
    }

    static calculateTransactionDataHash(transaction) {
        const validKeys = ['from', 'to', 'value', 'fee', 'dateCreated', 'data', 'senderPubKey'];
        const actualKeys = Object.keys(transaction);
        if (JSON.stringify(validKeys) !== JSON.stringify(actualKeys)) {
            throw new Error('Keys ' + actualKeys + ' are not valid!');
        }
        return SHA256(JSON.stringify(transaction)).toString();
    }
}

module.exports = HashProvider;