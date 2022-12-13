import React, { useState, useEffect } from 'react';
import axios from 'axios';

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

const driverDeliveries = () => {
  const [driverDeliveries, setDriverDeliveries] = useState([]);
  const [showDelivered, setShowDelivered] = useState(false);

  async function fetchDriverDeliveries() {
    const deliveries = await axios.get('http://localhost:4001/api/delivery/get/all/driver');
    setDriverDeliveries(deliveries.data.deliveries);
  }

  useEffect(() => {
    fetchDriverDeliveries();
  }, []);

  return (
    <div>
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
          </li>
        ))}
      </ul>
    </div>
  );
};

export default driverDeliveries;
