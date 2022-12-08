import { ObjectId } from "mongodb";

export interface DriverCreated {
    type: string,
    data: {
        _id: ObjectId,
        name: string,
        email: string,
        doNotDisturb: boolean
    }
}
