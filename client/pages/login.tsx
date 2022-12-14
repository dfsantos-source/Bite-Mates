import React, { ReactElement, useState } from 'react'
import axios, { AxiosResponse } from 'axios';
import Image from 'next/image';

export interface LoginFormProps {
  type: string
}

type LoginForm = "" | React.ReactElement<any, any> | null;

export default function login() {

  const [loginType, setLoginType] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const LoginForm: React.FunctionComponent<LoginFormProps> = (props: LoginFormProps) => {
    const type: string = props.type;
    const title: string = type === 'user' ? 
    'User Login' : 'Driver Login';   
    return (
      <div className='mt-5'>
        <h5>{title}</h5>
        <input onChange={(e): void => setEmail(e.target.value)} value={email} className='mb-2' type="text" name="" id="" placeholder='email'/>
        <br></br>
        <input onChange={(e): void => setPassword(e.target.value)} value={password} type="password" name="" id="" placeholder='password'/>
        <br></br>
        <button type="button" className="btn btn-primary mt-2" onClick={handleLoginClick}>Login</button>
      </div>
    );
  }

  const handleLoginClick = async(e: any) => {
    if (!email || !password) {
      alert('Error logging in please provide fields.');
    }
    const query: string = loginType === 'user' ? 'users' : 'drivers';
    const port: number = loginType === 'user' ? 4011 : 4002;
    const url: string = `http://localhost:${port}/api/${query}/login`;
    setEmail('');
    setPassword('');
    try {
      const res: AxiosResponse = await axios.post(
        url,
        {
          email,
          password
        }
      );
      alert('Login sucessful');
      console.log(res.data)
    } catch (err) {
      alert('Incorrect email or password');
    }
  }

  const handleUserClick: () => void = () => {
    setLoginType('user');
  }

  const handleDriverClick: () => void = () => {
    setLoginType('driver');
  }

  const getForm: () => LoginForm = () => {
    if (loginType === '') {
      return  '';
    } 
    return LoginForm({type: loginType});
  }

  const form: LoginForm = getForm();

  return (
    <div style={{  }} className='w-100 h-100 d-flex'>
        <Image style={{position: 'absolute', zIndex:-5}}className="object-cover" width={1920} height={1080} alt= "" src={'/loginGif.gif'}/>
        <div style={{ justifyContent: 'center', marginTop: '8%', marginBottom:"0%", flexDirection: 'column', marginLeft: 'auto', marginRight: 'auto'}}>
          <div className='card d-flex mx-auto' style={{paddingLeft: '120px', paddingRight: '120px', paddingTop:'50px', paddingBottom:'50px'}}>
          <Image style={{position: 'relative', marginLeft: 'auto', marginRight: 'auto'}}className="ml-auto mr-auto" width={200} height={200} alt= "" src={'/delivery.svg'}/>
            <h1 style={{color: `rgb(36, 105, 154)`}} className='card-title pt-1 pb-1' >BeFake</h1>
            <hr></hr>
            <h3 className=''>Login Page</h3>
            <h4 className='mt-1'>Are you a User or Driver?</h4>
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