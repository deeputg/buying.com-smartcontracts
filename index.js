const algosdk = require("algosdk");
const fs = require('fs').promises

// user declared account mnemonics
userMnemonic = "relief start derive trophy purpose sniff oil bird glass gun happy maze security debris key assume front garment private stamp cabin horse produce absorb erode";
creatorMnemonic = "verb entry during engage bar visa collect sight critic stone better civil burger zebra helmet flip pool grief clinic much novel wall panel above wet";

// user declared algod connection parameters
algodPort = "";
algodServer = "https://testnet-algorand.api.purestake.io/ps2";
// algodToken =  'Ia5iwM5mr84RUZPCNvfmRB5VrM7jQMK4cSWBcgZ1'
const algodToken = {
  'X-API-Key': "Ia5iwM5mr84RUZPCNvfmRB5VrM7jQMK4cSWBcgZ1"
};

// declare application state storage (immutable)
localInts = 5;
localBytes = 5;
globalInts = 5;
globalBytes = 5;

// user declared approval program (initial)
var approvalProgramSourceInitial = `#pragma version 2
txn ApplicationID
int 0
==
bnz l0
txn OnCompletion
int DeleteApplication
==
bnz l1
txn OnCompletion
int UpdateApplication
==
bnz l2
txna ApplicationArgs 0
byte "storeData"
==
bnz l3
err
l0:
byte "Creator"
txn Sender
app_global_put
int 1
return
b l4
l1:
txn Sender
byte "Creator"
app_global_get
==
return
b l4
l2:
txn Sender
byte "Creator"
app_global_get
==
return
b l4
l3:
txn Sender
byte "Creator"
app_global_get
==
bnz l5
err
l5:
int 1
return
l4:`;

// declare clear state program source
clearProgramSource = `#pragma version 2
int 0
global CurrentApplicationID
byte "voted"
app_local_get_ex
store 0
store 1
global Round
byte "VoteEnd"
app_global_get
<=
load 0
&&
bz l11
load 1
load 1
app_global_get
int 1
-
app_global_put
l11:
int 1
return
`;

async function fetchPrograms(){
  approvalProgramSourceInitial = await fs.readFile('./teal/payload.teal');
}

// helper function to compile program source
async function compileProgram(client, programSource) {
  let encoder = new TextEncoder();
  let programBytes = encoder.encode(programSource);
  let compileResponse = await client.compile(programBytes).do();
  let compiledBytes = new Uint8Array(Buffer.from(compileResponse.result, "base64"));
  // console.log("compile success", compiledBytes)
  return compiledBytes;
}

// helper function to await transaction confirmation
// Function used to wait for a tx confirmation
const waitForConfirmation = async function (algodclient, txId) {
  let status = await algodclient.status().do();
  let lastRound = status["last-round"];
  while (true) {
    const pendingInfo = await algodclient.pendingTransactionInformation(txId).do();
    if (pendingInfo["confirmed-round"] !== null && pendingInfo["confirmed-round"] > 0) {
      //Got the completed Transaction
      console.log("Transaction " + txId + " confirmed in round " + pendingInfo["confirmed-round"]);
      break;
    }
    lastRound++;
    await algodclient.statusAfterBlock(lastRound).do();
  }
};

const waitForRound = async (algodclient, toRound) => {
  let lastRound = 0;
  do {
    const status = await algodclient.status().do();
    lastRound = status["last-round"];
    console.log(lastRound)
  } while (toRound > lastRound);
  return lastRound;

}

// create new application
async function createApp(
  client,
  creatorAccount,
  approvalProgram,
  clearProgram,
  localInts,
  localBytes,
  globalInts,
  globalBytes,
  args
) {
  // define sender as creator
  sender = creatorAccount.addr;

  // declare onComplete as NoOp
  onComplete = algosdk.OnApplicationComplete.NoOpOC;

  // get node suggested parameters
  let params = await client.getTransactionParams().do();
  // comment out the next two lines to use suggested fee
  params.fee = 1000;
  params.flatFee = true;

  // create unsigned transaction
  let txn = algosdk.makeApplicationCreateTxn(
    sender,
    params,
    onComplete,
    approvalProgram,
    clearProgram,
    localInts,
    localBytes,
    globalInts,
    globalBytes,
    args
  );
  let txId = txn.txID().toString();

  // Sign the transaction
  let signedTxn = txn.signTxn(creatorAccount.sk);
  console.log("Signed transaction with txID: %s", txId);

  // Submit the transaction
  await client.sendRawTransaction(signedTxn).do();
  console.log("transaction send after signing (In createApp function)")

  // Wait for confirmation
  await waitForConfirmation(client, txId);

  // display results
  let transactionResponse = await client.pendingTransactionInformation(txId).do();
  let appId = transactionResponse["application-index"];
  console.log("Created new app-id: ", appId);
  return appId;
}

// optIn
async function optInApp(client, account, index) {
  // define sender
  sender = account.addr;

  // get node suggested parameters
  let params = await client.getTransactionParams().do();
  // comment out the next two lines to use suggested fee
  params.fee = 1000;
  params.flatFee = true;

  // create unsigned transaction
  let txn = algosdk.makeApplicationOptInTxn(sender, params, index);
  let txId = txn.txID().toString();

  // Sign the transaction
  let signedTxn = txn.signTxn(account.sk);
  console.log("Signed transaction with txID: %s", txId);

  // Submit the transaction
  await client.sendRawTransaction(signedTxn).do();

  // Wait for confirmation
  await waitForConfirmation(client, txId);

  // display results
  let transactionResponse = await client.pendingTransactionInformation(txId).do();
  console.log("Opted-in to app-id:", transactionResponse["txn"]["txn"]["apid"]);
}

// call application
async function callApp(client, account, index, appArgs) {
  // define sender
  sender = account.addr;

  // get node suggested parameters
  let params = await client.getTransactionParams().do();
  // comment out the next two lines to use suggested fee
  params.fee = 1000;
  params.flatFee = true;
  // create unsigned transaction
  let txn = algosdk.makeApplicationNoOpTxn(sender, params, index, appArgs);
  let txId = txn.txID().toString();

  // Sign the transaction
  let signedTxn = txn.signTxn(account.sk);
  console.log("Signed transaction with txID: %s", txId);

  // Submit the transaction
  await client.sendRawTransaction(signedTxn).do();

  // Wait for confirmation
  await waitForConfirmation(client, txId);

  // display results
  let transactionResponse = await client.pendingTransactionInformation(txId).do();
  console.log("Called app-id:", transactionResponse["txn"]["txn"]["apid"]);
  if (transactionResponse["global-state-delta"] !== undefined) {
    console.log("Global State updated:", transactionResponse["global-state-delta"]);
  }
  if (transactionResponse["local-state-delta"] !== undefined) {
    console.log("Local State updated:", transactionResponse["local-state-delta"]);
  }
}

// read local state of application from user account
async function readLocalState(client, account, index) {
  let accountInfoResponse = await client.accountInformation(account.addr).do();
  for (let i = 0; i < accountInfoResponse["apps-local-state"].length; i++) {
    if (accountInfoResponse["apps-local-state"][i].id == index) {
      console.log("User's local state:");
      for (let n = 0; n < accountInfoResponse["apps-local-state"][i][`key-value`].length; n++) {
        console.log(accountInfoResponse["apps-local-state"][i][`key-value`][n]);
      }
    }
  }
}

// read global state of application
async function readGlobalState(client, account, index) {
  let accountInfoResponse = await client.accountInformation(account.addr).do();
  for (let i = 0; i < accountInfoResponse["created-apps"].length; i++) {
    if (accountInfoResponse["created-apps"][i].id == index) {
      console.log("Application's global state:");
      for (let n = 0; n < accountInfoResponse["created-apps"][i]["params"]["global-state"].length; n++) {
        console.log(accountInfoResponse["created-apps"][i]["params"]["global-state"][n]);
      }
    }
  }
}

async function updateApp(client, creatorAccount, index, approvalProgram, clearProgram) {
  // define sender as creator
  sender = creatorAccount.addr;

  // get node suggested parameters
  let params = await client.getTransactionParams().do();
  // comment out the next two lines to use suggested fee
  params.fee = 1000;
  params.flatFee = true;

  // create unsigned transaction
  let txn = algosdk.makeApplicationUpdateTxn(sender, params, index, approvalProgram, clearProgram);
  let txId = txn.txID().toString();

  // Sign the transaction
  let signedTxn = txn.signTxn(creatorAccount.sk);
  console.log("Signed transaction with txID: %s", txId);

  // Submit the transaction
  await client.sendRawTransaction(signedTxn).do();

  // Wait for confirmation
  await waitForConfirmation(client, txId);

  // display results
  let transactionResponse = await client.pendingTransactionInformation(txId).do();
  let appId = transactionResponse["txn"]["txn"].apid;
  console.log("Updated app-id: ", appId);
  return appId;
}

// close out from application
async function closeOutApp(client, account, index) {
  // define sender
  sender = account.addr;

  // get node suggested parameters
  let params = await client.getTransactionParams().do();
  // comment out the next two lines to use suggested fee
  params.fee = 1000;
  params.flatFee = true;

  // create unsigned transaction
  let txn = algosdk.makeApplicationCloseOutTxn(sender, params, index);
  let txId = txn.txID().toString();

  // Sign the transaction
  let signedTxn = txn.signTxn(account.sk);
  console.log("Signed transaction with txID: %s", txId);

  // Submit the transaction
  await client.sendRawTransaction(signedTxn).do();

  // Wait for confirmation
  await waitForConfirmation(client, txId);

  // display results
  let transactionResponse = await client.pendingTransactionInformation(txId).do();
  console.log("Closed out from app-id:", transactionResponse["txn"]["txn"]["apid"]);
}

async function deleteApp(client, creatorAccount, index) {
  // define sender as creator
  sender = creatorAccount.addr;

  // get node suggested parameters
  let params = await client.getTransactionParams().do();
  // comment out the next two lines to use suggested fee
  params.fee = 1000;
  params.flatFee = true;

  // create unsigned transaction
  let txn = algosdk.makeApplicationDeleteTxn(sender, params, index);
  let txId = txn.txID().toString();

  // Sign the transaction
  let signedTxn = txn.signTxn(creatorAccount.sk);
  console.log("Signed transaction with txID: %s", txId);

  // Submit the transaction
  await client.sendRawTransaction(signedTxn).do();

  // Wait for confirmation
  await waitForConfirmation(client, txId);

  // display results
  let transactionResponse = await client.pendingTransactionInformation(txId).do();
  let appId = transactionResponse["txn"]["txn"].apid;
  console.log("Deleted app-id: ", appId);
  return appId;
}

async function clearApp(client, account, index) {

  // define sender as creator
  sender = account.addr;

  // get node suggested parameters
  let params = await client.getTransactionParams().do();
  // comment out the next two lines to use suggested fee
  params.fee = 1000;
  params.flatFee = true;

  // create unsigned transaction
  let txn = algosdk.makeApplicationClearStateTxn(sender, params, index);
  let txId = txn.txID().toString();

  // Sign the transaction
  let signedTxn = txn.signTxn(account.sk);
  console.log("Signed transaction with txID: %s", txId);

  // Submit the transaction
  await client.sendRawTransaction(signedTxn).do();

  // Wait for confirmation
  await waitForConfirmation(client, txId);

  // display results
  let transactionResponse = await client.pendingTransactionInformation(txId).do();
  let appId = transactionResponse["txn"]["txn"].apid;
  console.log("Cleared local state for app-id: ", appId);
  return appId;
}


const ItoB = (x)=> {
  var bytes = [];
  var i = 8;
  do {
    bytes[--i] = x & (255);
    x = x >> 8;
  } while (i)

  return new Uint8Array(Buffer.from(bytes));
}
async function main() {
  try {

    var myArgs = process.argv.slice(2);
    if(myArgs.length<=0)
    {
      console.log("please provide arguments")
      return
    }
    

    // initialize an algodClient
    let algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

    // get accounts from mnemonic
    let creatorAccount = algosdk.mnemonicToSecretKey(creatorMnemonic);
    let userAccount = algosdk.mnemonicToSecretKey(userMnemonic);

    // compile programs
    await fetchPrograms();
    console.log("progra fetched",approvalProgramSourceInitial)
    let approvalProgram = await compileProgram(algodClient, approvalProgramSourceInitial);
    let clearProgram = await compileProgram(algodClient, clearProgramSource);

    if(myArgs[0]=="create"){

        // create new application
        const appId = await createApp(
          algodClient,
          creatorAccount,
          approvalProgram,
          clearProgram,
          localInts,
          localBytes,
          globalInts,
          globalBytes,
        );
    } else if(myArgs[0]=="update"){
      const appId = parseInt(myArgs[1])
      await updateApp(algodClient,creatorAccount,appId,approvalProgram,clearProgram)
    }
    else if(myArgs[0]=="storeData"){
      const appId = parseInt(myArgs[1])
      let storingArgs = new Array();
      storingArgs.push(new Uint8Array(Buffer.from("storeData")));
      storingArgs.push(new Uint8Array(Buffer.from("indexFileHash")));
      storingArgs.push(new Uint8Array(Buffer.from("QmTJ2tnAyuM4Hdhwr2FvMkDagdHiDaJHjsHBSKqzxHy4SY")));
      // storingArgs.push(new Uint8Array(Buffer.from("customerId")));
      // storingArgs.push(new Uint8Array(Buffer.from("")));
      // storingArgs.push(new Uint8Array(Buffer.from("date")));
      // storingArgs.push(new Uint8Array(Buffer.from("1,2,3,4")));
      console.log(storingArgs)
  
      await callApp(algodClient, creatorAccount, appId, storingArgs);
  console.log("here")
      // read global state of application
      await readGlobalState(algodClient, creatorAccount, appId);
    }
  } catch (err) {
    console.log("err", err);
  }
}

main();
