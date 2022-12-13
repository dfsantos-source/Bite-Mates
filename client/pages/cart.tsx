import React, { useState, useEffect, ReactElement } from 'react'
import axios, { AxiosResponse } from 'axios';
import { config } from 'process';

export interface Cart {
    _id: string,
    userId: string,
    items: CartItem[]
}

export interface CartItem {
    _id: string,
    foodId: string,
    name: string,
    price: number,
    restaurantId: string
    quantity: number
}

export default function cart(): ReactElement {
  const [cart, setCart] = useState <Cart | null>(null);
  const [quantities, setQuantities] = useState <any>({});
  const [totalPrice, setTotalPrice] = useState <number>(0);
  const [orderType, setOrderType] = useState <string>('delivery');

  useEffect((): void => {
    const getData: () => Promise<void> = async() => {
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2Mzk2ZGI1MDk2YmRiNzhjZjlmNjRmYjUiLCJpYXQiOjE2NzA4MzA5Mjh9.TI7_z2KnjmXQKEIb23jo3Mwu6ABSzs0FFFIwWWTI0_c';
        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };
        try {
            const res: AxiosResponse = await axios.get( 
                'http://localhost:4003/api/cart/get',
                config
            );
            // console.log(res);
            const { data }: { data: Cart } = res;
            // console.log(data);
            setCart(data);

            let totalPrice: number = 0;
            const newQuantities: {[key: string]: number } = {};
            data.items.forEach((item: CartItem) => {
                newQuantities[item.name] = item.quantity;
                totalPrice += (item.price * item.quantity);
            })
            console.info('newQuantities', newQuantities);
            setQuantities(newQuantities);
            setTotalPrice(totalPrice);
        } catch(err) {
            console.log(err);
        }
    }
    getData();
  }, []);

  const handlePlaceOrderClick: () => Promise<void> = async() => {
    if (cart != null) {

        let totalPrice: number = 0;
        cart.items.forEach((item: CartItem) => {
            totalPrice += item.price;
        })


        const token: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2Mzk2ZGI1MDk2YmRiNzhjZjlmNjRmYjUiLCJpYXQiOjE2NzA4MzA5Mjh9.TI7_z2KnjmXQKEIb23jo3Mwu6ABSzs0FFFIwWWTI0_c';
        const config: {headers: {Authorization: string}} = {
            headers: { Authorization: `Bearer ${token}` }
        };

        const port: number = orderType === 'pickup' ? 4007 : 4001;
        const url: string = `http://localhost:${port}/api/${orderType}/create`;
        const res: AxiosResponse = await axios.post(
            url,
            {
                time: '',
                foods: cart.items,
                totalPrice: 0
                // totalPrice: totalPrice
            },
            config
        );

        console.log(res);

        if (res.status === 201) {
            setCart({...cart, ['items']: [] })
            setTotalPrice(0);
        }
    }
  }

  const CartItem = (props: {item: CartItem}): ReactElement => {
    const handleRemoveClick = async(): Promise<void> => {
        if (cart != null) {
            const cartId: string = cart._id;
            const foodId: string = props.item.foodId;
            const url: string = `http://localhost:4003/api/cart/remove/${cartId}/${foodId}`;
            const res: AxiosResponse = await axios.put(
              url
            );
            // console.log(res.data);
            setCart(res.data);
            setTotalPrice(totalPrice-(props.item.price * props.item.quantity))
        }
    }
  
    const handleSaveQuantityClick: () => Promise<void> = async() => {
        console.log(quantities[props.item.name])
        if (cart != null) {
            const cartId: string = cart._id;
            const itemId: string = props.item._id;
            const url: string = `http://localhost:4003/api/cart/edit/quantity/${cartId}/${itemId}`;
            const res: AxiosResponse = await axios.put(
              url,
              {quantity: quantities[props.item.name]}
            );
            setCart(res.data);
            let newPrice: number = 0;
            console.log();
            res.data.items.forEach((item: CartItem) => {
                newPrice += (item.price * item.quantity);
            })
            console.info('newPrice', newPrice);
            setTotalPrice(newPrice);

            alert('Successfully edited quantity of item')
        }
    }

    const onChangeQuantity: (e: any) => void = (e: any) => {
        const itemName: string = props.item.name;
        setQuantities({...quantities, [itemName]: e.target.value})
        console.log(quantities[props.item.name])
    }

    return (
        <div className='card mb-2 p-3' key={props.item._id}>
            <p>Name: {props.item.name}</p>
            <p>Price: {props.item.price}</p>
            <p>Quantity: {props.item.quantity}</p>
            <button type="button" onClick={handleRemoveClick} className="w-25 btn btn-danger">Remove</button>
            {/* <button type="button" onClick={handleEditQuantityClick} className="w-50 mt-2 btn btn-primary">Edit Quantity</button> */}
            
            <div>
                <p className='mt-3'>Edit Quantity:</p>
                <input style={{marginRight: '2rem'}} onChange={onChangeQuantity} value={quantities[props.item.name]} className='mb-2 w-25' type="text" name="" id="" placeholder='quantity'/>
                <button type="button" onClick={handleSaveQuantityClick} className="w-25 btn btn-primary">Save</button>
            </div>
        </div>
    )
  }

  const CartList = (props: {data: CartItem[]}) => {
    // console.log(props.data);
    return props.data.map((item: CartItem) => {
        return CartItem({item: item});
    })
  }

  return (
    <div>
        <div style={{display: 'flex', justifyContent: 'center', marginTop: '10%', flexDirection: 'column'}}>
          <div className='card p-4 w-50'  style={{marginLeft: 'auto', marginRight: 'auto'}}>
            <h1 className='card-title'>Cart</h1>
            <div className="d-flex flex-column w-50 mx-auto mt-4">
              {cart == null ? 'Loading' : CartList({data: cart.items})}
              <h4 className='mt-3 d-flex justify-content-center'>Total Price: ${totalPrice}</h4>
              <label className='h5 mt-4'>Choose an order type:</label>
                <select className='w-25 mt-2 mb-3' onChange={e => {setOrderType(e.target.value); }} value={orderType} id="orderType" name="orderType">
                <option id="delivery" value="delivery">Delivery</option>
                <option id="pickup" value="pickup">Pickup</option>
              </select>
              <button type="button" onClick={handlePlaceOrderClick} className="w-50 mt-2 h-25 m-auto btn btn-primary">Place Order</button>
            </div>
          </div>
        </div>
    </div>
  )
}