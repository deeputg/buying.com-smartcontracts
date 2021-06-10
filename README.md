# smartcontracts

Algorand smart contract written in pyteal

## Export environmental variables
```
export CREATOR_MNEMONIC = "creator mnemonic here"
export UPDATOR_MNEMONIC = "updator mnemonic here"
export ALGOD_TOKEN = "purestake access token for mainnet"
```
## Install dependencies
```
yarn
```
## Run pyteal program
Run pyteal program to generate the teal program
```
cd pyteal
python3 payload.py
cd ..
```
teal program will be generated in `teal/payload.teal` file.
## Create app
to deploy the smartcontract for the first time
```
node index.js create
```
## Update app
to update the app with already deployed appId
```
node index.js update <appId>
```