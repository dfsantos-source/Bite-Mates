import { ObjectId } from "mongodb";

export interface Driver {
    _id: ObjectId,
    name: string,
    email: string,
    password: string,
    doNotDisturb: boolean
}
