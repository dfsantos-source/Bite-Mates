import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DriverNavbar from '../components/DriverNavbar';

interface Delivery {
  _id: string;
  userId: string;
  driverId: string;
  time: string;
  foods: [];
  totalPrice: number;
  status: string;
  type: string;
}

const DriverDeliveries = () => {
  const [driverDeliveries, setDriverDeliveries] = useState([]);
  const [showDelivered, setShowDelivered] = useState(false);

  async function fetchDriverDeliveries() {
    const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    };
    try {
      const deliveries = await axios.get('http://localhost:4001/api/delivery/get/all/driver', config);
      setDriverDeliveries(deliveries.data.deliveries);
    } catch (error) {
      console.log("no deliveries")
    }
  }

  async function completeDelivery(deliveryId){
    const data = {
        _id : deliveryId
    }
    await axios.put('http://localhost:4001/api/delivery/complete', data);
    fetchDriverDeliveries()
  }

  useEffect(() => {
    fetchDriverDeliveries();
  }, []);

  return (
    <div>
      <DriverNavbar />
      <h1 style={{ fontSize: '2em', marginBottom: '20px' }}>Driver Deliveries</h1>
      <button onClick={() => setShowDelivered(!showDelivered)}>
        {showDelivered ? 'Hide Delivered' : 'Show Delivered'}
        </button>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {driverDeliveries
        .filter((delivery: Delivery) => !showDelivered || delivery.status !== "delivered")
        .map((delivery: Delivery) => (
          <li key={delivery._id} style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '10px' }}>
            <p style={{ fontSize: '1.2em', marginBottom: '5px' }}>
              <strong>ID:</strong> {delivery._id}
            </p>
            <p style={{ marginBottom: '5px' }}>
              <strong>Sender:</strong> {delivery.driverId}
            </p>
            <p>
              <strong>Recipient:</strong> {delivery.userId}
            </p>
            <p>
              <strong>Status:</strong> {delivery.status}
            </p>
            <p>
              <strong>Total Price:</strong> {delivery.totalPrice}
            </p>
            {delivery.status === "in transit"? 
                    <button
                    onClick={() => {
                        completeDelivery(delivery._id);
                    }}
                    >
                    Complete Delivery
                </button>
                :
                null
            }
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DriverDeliveries;
