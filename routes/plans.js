import express from 'express'
import { query } from '../config/db.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM insurance_plans ORDER BY created_at DESC')
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { name, description, premium_range, coverage, category } = req.body
    const result = await query(
      'INSERT INTO insurance_plans (name, description, premium_range, coverage, category) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, description, premium_range, coverage, category]
    )
    res.status(201).json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { name, description, premium_range, coverage, category } = req.body
    await query(
      'UPDATE insurance_plans SET name = $1, description = $2, premium_range = $3, coverage = $4, category = $5 WHERE id = $6',
      [name, description, premium_range, coverage, category, req.params.id]
    )
    res.json({ message: 'Plan updated successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await query('DELETE FROM insurance_plans WHERE id = $1', [req.params.id])
    res.json({ message: 'Plan deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router