const BurgerWallet = require('../burgerWallet');
const burgerWallet = new BurgerWallet();

const transaction = {
    "from": "c3293572dbe6ebc60de4a20ed0e21446cae66b17",
    "to": "f51362b7351ef62253a227a77751ad9b2302f911",
    "value": 250123,
    "fee": 10,
    "dateCreated": "2018-01-10T17:53:48.972Z",
    "data": "KIM",
    "senderPubKey": burgerWallet.publicKey
}

burgerWallet.send(transaction);