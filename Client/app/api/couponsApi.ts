'use server'

import axios from 'axios'
import { sign } from 'jsonwebtoken'

const url = process.env.BACKEND_URL
const authKey = process.env.AUTH_KEY as string

async function encrypt(key: string) {
  return await sign({}, key)
}

export async function createChildProfile({
  user_id,
  child_name,
  birth_date,
  gender,
  favorite_category,
  favorite_skill,
  note,
}: {
  user_id: number
  child_name: string
  birth_date: string
  gender?: string
  favorite_category?: string
  favorite_skill?: string
  note?: string
}) {
  const sendingKey = await encrypt(authKey)
  try {
    const response = await axios.post(
      `${url}/api/coupons/child-profile`,
      { user_id, child_name, birth_date, gender, favorite_category, favorite_skill, note },
      { headers: { authorization: `Bearer ${sendingKey}` }, validateStatus: () => true },
    )
    return { status: response.status, data: response.data }
  } catch (error) {
    console.error('createChildProfile error:', error)
    return { status: 500, error: 'Internal Server Error' }
  }
}

export async function updateChildProfile({
  child_id,
  user_id,
  child_name,
  birth_date,
  gender,
  favorite_category,
  favorite_skill,
  note,
}: {
  child_id: number
  user_id: number
  child_name: string
  birth_date: string
  gender?: string
  favorite_category?: string
  favorite_skill?: string
  note?: string
}) {
  const sendingKey = await encrypt(authKey)
  try {
    const response = await axios.put(
      `${url}/api/coupons/child-profile/${child_id}`,
      { user_id, child_name, birth_date, gender, favorite_category, favorite_skill, note },
      { headers: { authorization: `Bearer ${sendingKey}` }, validateStatus: () => true },
    )
    return { status: response.status, data: response.data }
  } catch (error) {
    console.error('updateChildProfile error:', error)
    return { status: 500, error: 'Internal Server Error' }
  }
}

export async function deleteChildProfile({ child_id, user_id }: { child_id: number; user_id: number }) {
  const sendingKey = await encrypt(authKey)
  try {
    const response = await axios.delete(`${url}/api/coupons/child-profile/${child_id}`, {
      headers: { authorization: `Bearer ${sendingKey}` },
      data: { user_id },
      validateStatus: () => true,
    })
    return { status: response.status, data: response.data }
  } catch (error) {
    console.error('deleteChildProfile error:', error)
    return { status: 500, error: 'Internal Server Error' }
  }
}

export async function getChildProfiles(userId: number) {
  const sendingKey = await encrypt(authKey)
  try {
    const response = await axios.get(`${url}/api/coupons/child-profiles/${userId}`, {
      headers: { authorization: `Bearer ${sendingKey}` },
      validateStatus: () => true,
    })
    return { status: response.status, data: response.data }
  } catch (error) {
    console.error('getChildProfiles error:', error)
    return { status: 500, error: 'Internal Server Error' }
  }
}

export async function getBirthdayCoupons(userId: number) {
  const sendingKey = await encrypt(authKey)
  try {
    const response = await axios.get(`${url}/api/coupons/birthday/${userId}`, {
      headers: { authorization: `Bearer ${sendingKey}` },
      validateStatus: () => true,
    })
    return { status: response.status, data: response.data }
  } catch (error) {
    console.error('getBirthdayCoupons error:', error)
    return { status: 500, error: 'Internal Server Error' }
  }
}

export async function getGiftSuggestions(userId: number) {
  const sendingKey = await encrypt(authKey)
  try {
    const response = await axios.get(`${url}/api/coupons/gift-suggestions/${userId}`, {
      headers: { authorization: `Bearer ${sendingKey}` },
      validateStatus: () => true,
    })
    return { status: response.status, data: response.data }
  } catch (error) {
    console.error('getGiftSuggestions error:', error)
    return { status: 500, error: 'Internal Server Error' }
  }
}

export async function runBirthdayReminderHandler() {
  const sendingKey = await encrypt(authKey)
  try {
    const response = await axios.post(
      `${url}/api/coupons/birthday-reminders/run`,
      {},
      { headers: { authorization: `Bearer ${sendingKey}` }, validateStatus: () => true },
    )
    return { status: response.status, data: response.data }
  } catch (error) {
    console.error('runBirthdayReminderHandler error:', error)
    return { status: 500, error: 'Internal Server Error' }
  }
}

export async function applyCouponHandler({
  code,
  userID,
  amount,
}: {
  code: string
  userID: string | number
  amount: number
}) {
  const sendingKey = await encrypt(authKey)
  try {
    const response = await axios.post(
      `${url}/api/coupons/apply`,
      { code, userID, amount },
      { headers: { authorization: `Bearer ${sendingKey}` }, validateStatus: () => true },
    )
    return { status: response.status, data: response.data }
  } catch (error: any) {
    console.error('applyCouponHandler error:', error?.response?.data || error)
    return {
      status: 500,
      error: error?.response?.data?.error || 'Không áp dụng được mã giảm giá',
    }
  }
}
