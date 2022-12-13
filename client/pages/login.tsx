import React, { ReactElement, useState } from 'react'
import axios, { AxiosResponse } from 'axios';

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
      <div className='mt-4'>
        <div>{title}</div>
        <input onChange={(e): void => setEmail(e.target.value)} value={email} className='mb-2' type="text" name="" id="" placeholder='email'/>
        <br></br>
        <input onChange={(e): void => setPassword(e.target.value)} value={password} type="text" name="" id="" placeholder='password'/>
        <br></br>
        <button type="button" className="btn btn-primary mt-2" onClick={handleLoginClick}>Login</button>
      </div>
    );
  }

  const handleLoginClick = async(e: any) => {
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
      alert('Error logging in');
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