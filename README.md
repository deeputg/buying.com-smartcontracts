# Payload Smartcontract

The payload smart contract which stores details of all the orders. It stores an IPFS hash which is an index of all the individual IPFS hashes.The order details of each day are stored as an IPFS file and each of these hashes are appended to the index IPFS file.

## Deploy smart contract
Please follow the steps to deploy the smart contract to Algorand.

### Export environmental variables
```
export CREATOR_MNEMONIC = "creator mnemonic here"
export UPDATOR_MNEMONIC = "updator mnemonic here"
export ALGOD_TOKEN = "purestake access token for mainnet"
```
### Install dependencies
```
yarn
```
### Run pyteal program
Run pyteal program to generate the teal program
```
cd pyteal
python3 payload.py
cd ..
```
teal program will be generated in `teal/payload.teal` file.
### Create app
This will deploy the smartcontract located in `teal/payload.teal` to the Algorand blockchain and return the appId after confirming the transaction.
```
node index.js create
```
### Update app
This will redeploy the smartcontract located in `teal/payload.teal` to the Algorand blockchain. The appId will be same.
```
node index.js update <appId>
```