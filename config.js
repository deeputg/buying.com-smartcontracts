const algosdk = require("algosdk");

// user declared account mnemonics
const userMnemonic = "relief start derive trophy purpose sniff oil bird glass gun happy maze security debris key assume front garment private stamp cabin horse produce absorb erode";
const creatorMnemonic = "verb entry during engage bar visa collect sight critic stone better civil burger zebra helmet flip pool grief clinic much novel wall panel above wet";

// user declared algod connection parameters
const algodPort = "";
const algodServer = "https://testnet-algorand.api.purestake.io/ps2";
const algodToken = {
  'X-API-Key': "Ia5iwM5mr84RUZPCNvfmRB5VrM7jQMK4cSWBcgZ1"
};

// initialize an algodClient
const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

// declare application state storage (immutable)
const localInts = 0;
const localBytes = 0;
const globalInts = 0;
const globalBytes = 3;

module.exports ={
  creatorMnemonic,
  userMnemonic,
  localInts,
  localBytes,
  globalInts,
  globalBytes,
  algodClient,
}