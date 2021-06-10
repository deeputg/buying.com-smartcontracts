from pyteal import *


def approval_program():
    on_creation = Seq([
        App.globalPut(Bytes("Creator"), Txn.sender()),
        App.globalPut(Bytes("indexFileHash"), Bytes("")),
        App.globalPut(Bytes("Updator"), Addr(
            "IVJRGE77IR4MIOUSLSSKMRYRJHMDBXSQ65JRAJI5YYC2FCBHSFHAVZIRIM")),
        Return(Int(1))
    ])

    value = Txn.application_args[1]

    is_creator = Txn.sender() == App.globalGet(Bytes('Creator'))
    is_updator = Txn.sender() == App.globalGet(Bytes('Updator'))
    is_valid_length = Len(value) == Int(46)
    is_valid_hash = Substring(value, Int(0), Int(2)) == Bytes('Qm')

    on_storeData = Seq([
        Assert(Txn.application_args.length() == Int(2)),
        Assert(is_updator),
        Assert(is_valid_length),
        Assert(is_valid_hash),
        App.globalPut(Bytes('indexFileHash'), value),
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
    with open('../teal/payload.teal', 'w') as f:
        compiled = compileTeal(approval_program(), Mode.Application)
        f.write(compiled)
