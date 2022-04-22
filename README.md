# ankoorapte.com
Ankoor's website

## DevTools
- Start a Ganache server.
- Open Chrome and login to MetaMask.
- Create a local network in MetaMask using RPC server URL from Ganache (HTTP://127.0.0.1:7545) and Chain ID 1337.
- Import account into MetaMask using private key from Ganache server.
- Connect the MetaMask account to the local network.
- Run the commands below one at a time.
- Verify that the account is charged by the same amount on Ganache and MetaMask.

```
git checkout dapp
git pull
npm install
truffle compile
truffle migrate --reset
truffle test
npm run dev
```