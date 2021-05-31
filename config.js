const algosdk = require("algosdk");

// user declared account mnemonics
const userMnemonic = process.env.UPDATOR_MNEMONIC; // IVJRGE77IR4MIOUSLSSKMRYRJHMDBXSQ65JRAJI5YYC2FCBHSFHAVZIRIM
const creatorMnemonic = process.env.CREATOR_MNEMONIC; // VAMKGCYKG4TSJH5PRIZUYVOSSBUXDSWYU5XYDFFTKLGK6GZLZZJ57QE3EQ

// user declared algod connection parameters
const algodPort = "";
const algodServer = "https://mainnet-algorand.api.purestake.io/ps2";
const algodToken = {
  'X-API-Key': process.env.ALGOD_TOKEN
};

// initialize an algodClient
const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

// declare application state storage (immutable)
const localInts = 0;
const localBytes = 0;
const globalInts = 0;
const globalBytes = 3;

module.exports = {
  creatorMnemonic,
  userMnemonic,
  localInts,
  localBytes,
  globalInts,
  globalBytes,
  algodClient,
}