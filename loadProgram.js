const approvalProgram = `#pragma version 2
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
txna ApplicationArgs 1
txna ApplicationArgs 2
app_global_put
int 1
return
l4:`

module.exports={approvalProgram}