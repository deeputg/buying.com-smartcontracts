const algosdk = require("algosdk");
const fs = require('fs').promises
const config = require('./config')

// user declared approval program (initial)
var approvalProgramSourceInitial;

// declare clear state program source
clearProgramSource = `#pragma version 2
int 1`;

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
    let algodClient = config.algodClient;

    // get accounts from mnemonic
    let creatorAccount = algosdk.mnemonicToSecretKey(config.creatorMnemonic);
    let userAccount = algosdk.mnemonicToSecretKey(config.userMnemonic);

    // compile programs
    await fetchPrograms();
    console.log("program fetched",approvalProgramSourceInitial)
    let approvalProgram = await compileProgram(algodClient, approvalProgramSourceInitial);
    let clearProgram = await compileProgram(algodClient, clearProgramSource);

    if(myArgs[0]=="create"){
        // create new application
        const appId = await createApp(
          algodClient,
          creatorAccount,
          approvalProgram,
          clearProgram,
          config.localInts,
          config.localBytes,
          config.globalInts,
          config.globalBytes,
        );
    } else if(myArgs[0]=="update"){
      // update the application
      const appId = parseInt(myArgs[1])
      await updateApp(algodClient,creatorAccount,appId,approvalProgram,clearProgram)
    }
    else if(myArgs[0]=="storeData"){
      // store the payload from ipfs in the global state of the app
      const appId = parseInt(myArgs[1])
      let storingArgs = new Array();
      storingArgs.push(new Uint8Array(Buffer.from("storeData")));
      storingArgs.push(new Uint8Array(Buffer.from("indexFileHash")));
      storingArgs.push(new Uint8Array(Buffer.from("QmTJ2tnAyuM4Hdhwr2FvMkDagdHiDaJHjsHBSKqzxHy4SY")));
      // console.log(storingArgs)
      await callApp(algodClient, creatorAccount, appId, storingArgs);
      
      // read global state of application
      await readGlobalState(algodClient, creatorAccount, appId);
    }
  } catch (err) {
    console.log("err", err);
  }
}

main();
