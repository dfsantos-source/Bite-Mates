import { Food } from "./dataTypes"

export interface RestaurantCreated {
    type: string
    data:{
     _id: string,
     name: string,
     address: string,
     type: string
     foods: Food[]
    }
}