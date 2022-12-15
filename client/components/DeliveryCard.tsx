import React from 'react'
import { Delivery } from './UserDeliveries'

//Author: Aayush Bhagat
//Github ID: Aayush-Bhagat

interface Props{
    delivery: Delivery
}

export default function DeliveryCard({delivery}: Props) {
  return (
      <div>
          <div >Delivery:</div>
          <div>ID: {delivery._id}</div>
          <div>STATUS: {delivery.status}</div>
          <div>TOTAL PRICE: {delivery.totalPrice}</div>
          <div> FOODS: {delivery.foods.map((food) => (
              <div key={food._id}>
                  <div> {food.name} </div>
              </div>
          ))}</div>
      </div>
  )
}
