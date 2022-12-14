import React from 'react'
import UserDeliveries from '../components/UserDeliveries'
import UserNavbar from '../components/userNavbar'


export default function UserOrders() {
  return (
    <div>
        <UserNavbar />
         <h1>Your Orders</h1>
          <UserDeliveries/>
    </div>

  )
}
