import React, { useState } from 'react'
import axios from 'axios';

export default function login() {

  const [loginType, setLoginType] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const LoginForm: any = (props: any) => {
    const type = props.type;
    const title: string = type === 'user' ? 
    'User Login' : 'Driver Login';   
    return (
      <div className='mt-4'>
        <div>{title}</div>
        <input onChange={e => setEmail(e.target.value)} value={email} className='mb-2' type="text" name="" id="" placeholder='email'/>
        <br></br>
        <input onChange={e => setPassword(e.target.value)} value={password} type="text" name="" id="" placeholder='password'/>

        <br></br>
        <button type="button" className="btn btn-primary mt-2" onClick={handleLoginClick}>Login</button>
      </div>
    );
  }

  const handleLoginClick = async(e: any) => {
    const query = loginType === 'user' ? 'users' : 'drivers';
    const port = loginType === 'user' ? 4011 : 4002;
    await axios.post(
      `http://localhost:${port}/api/${query}/login`,
      {
        email,
        password
      }
    );
  }

  const handleUserClick = (e: any) => {
    setLoginType('user');
  }

  const handleDriverClick = (e: any) => {
    setLoginType('driver');
  }

  const getForm = () => {
    if (loginType === '') {
      return  '';
    } 
    return <LoginForm type={loginType}></LoginForm>;
  }

  const form = getForm();

  return (
    <div>
        <div style={{display: 'flex', justifyContent: 'center', marginTop: '10%', flexDirection: 'column'}}>
          <div className='card p-4'  style={{marginLeft: 'auto', marginRight: 'auto'}}>
            <h1 className='card-title'>Login Page</h1>
            <h4 className='mt-2'>Are you a User or Driver?</h4>
            <div className="d-flex flex-column w-50 mx-auto mt-4">
              <button type="button" className="btn btn-primary mb-4" onClick={handleUserClick}>User</button>
              <button type="button" className="btn btn-primary" onClick={handleDriverClick}>Driver</button>
            </div>
            {form}
          </div>
        </div>
    </div>
  )
}