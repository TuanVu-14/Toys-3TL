"use server"
import axios from 'axios';
import { sign } from 'jsonwebtoken';
async function encrypt(key:string){ return sign({},key) }
export default async function resetPassHandler({email,password,otp}:{email:string,password:string,otp:string}) {
  const url = process.env.BACKEND_URL;
  const authKey = process.env.JWT_AUTH_KEY || process.env.AUTH_KEY || process.env.JWT_KEY || process.env.JWT_ENCRYPTION_KEY;
  if (!url) return {status:500,data:{error:'Missing BACKEND_URL'}};
  if (!authKey) return {status:500,data:{error:'Missing authentication key'}};
  const sendingKey = await encrypt(authKey as string);
  try {
    const response = await axios.post(`${url}/api/user/reset-password`, {email,password,otp}, {
      headers: { authorization:`Bearer ${sendingKey}` },
    });
    return {status:response.status,data:response.data}
  } catch (error:any) {
    return {status:error?.response?.status || 500,data:error?.response?.data || {error:'Internal Server Error'}}
  }
};
