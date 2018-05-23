const BurgerWallet = require('./burgerWallet');
const BurgerTransaction = require('./burgerTransaction');

class BurgerFaucet {

    constructor() {
        this.wallet = new BurgerWallet('831da5badbeacc2311f0bc301b19dea1f29ff67556345bcfafee9651f835809c');
    }

    /**
     * Transfers 100 burgers from the faucet to the recipient.
     * 
     * @param {string} recipient 
     * @param {integer} amount 
     */
    async sendBurgers(recipient, amount) {
        const burgerTransaction = new BurgerTransaction(
            this.wallet.address,
            recipient,
            parseInt(amount),
            100,
            new Date(),
            "Generous burgers fresh from the oven",
            this.wallet.publicKey
        );
        const response = await this.wallet.send(burgerTransaction);
        return response;
    }

    /**
     * Creates a faucet transaction with generous preset values.
     */
    createFaucetTransaction() {
        return new BurgerTransaction(
            '0x000000000000000000000000000000000000000',
            this.wallet.address,
            100000000,
            1,
            new Date(),
            'The first burgers',
            '0x000000000000000000000000000000000000000'
        );
    }
}

const burgerFaucet = new BurgerFaucet();
const burgerFaucetInstance = Object.freeze(burgerFaucet); // Singleton pattern

module.exports = burgerFaucetInstance;