import React from 'react'
import UserDeliveries from '../components/UserDeliveries'
import UserNavbar from '../components/userNavbar'
import UserPickups from '../components/UserPickups'


export default function UserOrders() {
  return (
    <div>
        <UserNavbar />
         <h1>Your Orders</h1>
        <UserDeliveries/>
        <UserPickups />
    </div>

  )
}
