// routes/companies.js
const express = require('express');
const { ObjectId } = require('mongodb');
const { getDb } = require('../db/connect');

const router = express.Router();
const COLLECTION = 'companies';

function validateCompany(b) {
  const errs = [];
  if (!b || typeof b !== 'object') errs.push('body required');
  if (!b.name || typeof b.name !== 'string') errs.push('name required (string)');
  if (b.domain && typeof b.domain !== 'string') errs.push('domain must be string');
  if (errs.length) { const e = new Error(errs.join('; ')); e.status = 400; throw e; }
}

// GET all
router.get('/', async (_req, res, next) => {
  try {
    const docs = await getDb().collection(COLLECTION).find().toArray();
    res.status(200).json(docs);
  } catch (e) { next(e); }
});

// GET one
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid company id' });
    const doc = await getDb().collection(COLLECTION).findOne({ _id: new ObjectId(id) });
    if (!doc) return res.status(404).json({ message: 'Company not found' });
    res.status(200).json(doc);
  } catch (e) { next(e); }
});

// POST
router.post('/', async (req, res, next) => {
  try {
    validateCompany(req.body);
    const { insertedId } = await getDb().collection(COLLECTION).insertOne(req.body);
    const created = await getDb().collection(COLLECTION).findOne({ _id: insertedId });
    res.status(201).json(created);
  } catch (e) { next(e); }
});

// PUT
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid company id' });
    validateCompany(req.body);
    const r = await getDb().collection(COLLECTION).findOneAndUpdate(
      { _id: new ObjectId(id) }, { $set: req.body }, { returnDocument: 'after' }
    );
    if (!r.value) return res.status(404).json({ message: 'Company not found' });
    res.status(200).json(r.value);
  } catch (e) { next(e); }
});

// DELETE
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid company id' });
    const r = await getDb().collection(COLLECTION).deleteOne({ _id: new ObjectId(id) });
    if (r.deletedCount === 0) return res.status(404).json({ message: 'Company not found' });
    res.status(204).send();
  } catch (e) { next(e); }
});

module.exports = router;
