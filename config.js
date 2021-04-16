const algosdk = require("algosdk");
const {approvalProgram} = require('./loadProgram')


// user declared algod connection parameters
const algodPort = "";
const algodServer = "https://testnet-algorand.api.purestake.io/ps2";
const algodToken = {
  'X-API-Key': "Ia5iwM5mr84RUZPCNvfmRB5VrM7jQMK4cSWBcgZ1"
};

// initialize an algodClient
const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);


// declare application state storage (immutable)
const localInts = 5;
const localBytes = 5;
const globalInts = 5;
const globalBytes = 5;

module.exports ={
  algosdk,
  creatorMnemonic,
  userMnemonic,
  algodPort,
  algodServer,
  algodToken,
  localInts,
  localBytes,
  globalInts,
  globalBytes,
  algodClient,
}