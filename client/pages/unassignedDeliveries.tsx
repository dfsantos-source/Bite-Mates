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

const UnassignedDeliveries = () => {
  const [unassignedDeliveries, setUnassignedDeliveries] = useState([]);

  async function fetchUnassignedDeliveries() {
    const deliveries = await axios.get('http://localhost:4001/api/delivery/get/all/unassigned');
    setUnassignedDeliveries(deliveries.data.deliveries);
  }

  useEffect(() => {
    fetchUnassignedDeliveries();
  }, []);

    async function assignDriver(deliveryId){
        const config = {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        };
        const data = {
            _id : deliveryId,
        }
        await axios.put('http://localhost:4001/api/delivery/driver/assign', data, config);
        fetchUnassignedDeliveries();
    }

  return (
    <div>
      <h1 style={{ fontSize: '2em', marginBottom: '20px' }}>Unassigned Deliveries</h1>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {unassignedDeliveries.map((delivery: Delivery) => (
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
            <button
                onClick={() => {
                    assignDriver(delivery._id);
                }}
                >
                Assign Delivery
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UnassignedDeliveries;