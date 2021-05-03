from pyteal import *

def approval_program():
    on_creation = Seq([
        App.globalPut(Bytes("Creator"), Txn.sender()),
        App.globalPut(Bytes("Updator"), Addr("O7MYWYE25TYP6POTZT7SA4YAC6EAJI2B7XMUFBXBK7K4BCDGQ4SGL6YDVM")),
        Return(Int(1))
    ])

    key = Txn.application_args[1]
    value = Txn.application_args[2]

    is_creator = Txn.sender() == App.globalGet(Bytes("Creator"))
    is_updator = Txn.sender() == App.globalGet(Bytes("Updator"))
    is_valid_key = key == Bytes("indexFileHash")
    is_valid_value = Len(Bytes(value.__repr__())) == Int(46)
    #is_valid_hash = Bytes(value.__repr__()[0]) == Bytes('Q')  
                 

    on_storeData = Seq([
        Assert(Txn.application_args.length() == Int(3)),
        Assert(is_updator),
        Assert(is_valid_key),
        Assert(is_valid_value),
        #Assert(is_valid_hash),
        App.globalPut(key, value),
        Return(Int(1))
    ])

    program = Cond(
        [Txn.application_id() == Int(0), on_creation],
        [Txn.on_completion() == OnComplete.DeleteApplication, Return(is_creator)],
        [Txn.on_completion() == OnComplete.UpdateApplication, Return(is_creator)],
        [And(Txn.application_args[0] == Bytes("storeData"), 
                               Txn.on_completion() == OnComplete.NoOp), 
                                                       on_storeData]

    )

    return program


if __name__ == "__main__":
    with open('./teal/payload.teal', 'w') as f:
        compiled = compileTeal(approval_program(), Mode.Application)
        f.write(compiled)
