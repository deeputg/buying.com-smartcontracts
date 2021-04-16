from pyteal import *
import json


class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age


def approval_program():
    on_creation = Seq([
        App.globalPut(Bytes("Creator"), Txn.sender()),
        Return(Int(1))
    ])

    is_creator = Txn.sender() == App.globalGet(Bytes("Creator"))

    key = Txn.application_args[1]
    value = Txn.application_args[2]

    on_storeData = Seq([
        Assert(is_creator),
        App.globalPut(key, value),
        Return(Int(1))
    ])

    program = Cond(
        [Txn.application_id() == Int(0), on_creation],
        [Txn.on_completion() == OnComplete.DeleteApplication, Return(is_creator)],
        [Txn.on_completion() == OnComplete.UpdateApplication, Return(is_creator)],
        # [Txn.on_completion() == OnComplete.CloseOut, on_closeout],
        # [Txn.on_completion() == OnComplete.OptIn, on_register],
        [Txn.application_args[0] == Bytes("storeData"), on_storeData]
    )

    return program


if __name__ == "__main__":
    with open('../teal/payload.teal', 'w') as f:
        compiled = compileTeal(approval_program(), Mode.Application)
        f.write(compiled)
