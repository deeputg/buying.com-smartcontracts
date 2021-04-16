const {
  algosdk,
  algodClient
} = require('./config')

// user declared account mnemonics
const creatorMnemonic = "relief start derive trophy purpose sniff oil bird glass gun happy maze security debris key assume front garment private stamp cabin horse produce absorb erode";
const userMnemonic = "verb entry during engage bar visa collect sight critic stone better civil burger zebra helmet flip pool grief clinic much novel wall panel above wet";

// get accounts from mnemonic
let creatorAccount = algosdk.mnemonicToSecretKey(creatorMnemonic);
let userAccount = algosdk.mnemonicToSecretKey(userMnemonic);