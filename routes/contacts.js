// routes/contacts.js
const express = require('express');
const { ObjectId } = require('mongodb');
const { getDb } = require('../db/connect');

const router = express.Router();

const COLLECTION = 'contacts';
const REQUIRED = ['firstName', 'lastName', 'email', 'favoriteColor', 'birthday'];

// ---------- Validation ----------
const isEmail = (s) => typeof s === 'string' && /\S+@\S+\.\S+/.test(s);
// Accepts "YYYY-MM-DD" or any Date.parse-able string; you can tighten if your class requires strict YYYY-MM-DD
const isISODate = (s) => typeof s === 'string' && !isNaN(Date.parse(s));

function validateContact(body) {
  const errs = [];
  if (!body || typeof body !== 'object') errs.push('body required');

  // presence of required fields
  for (const k of REQUIRED) if (!(k in body)) errs.push(`${k} is required`);

  // types / formats
  if (body.firstName && typeof body.firstName !== 'string') errs.push('firstName must be string');
  if (body.lastName && typeof body.lastName !== 'string') errs.push('lastName must be string');
  if (body.email && !isEmail(body.email)) errs.push('email must be valid');
  if (body.favoriteColor && typeof body.favoriteColor !== 'string') errs.push('favoriteColor must be string');
  if (body.birthday && !isISODate(body.birthday)) errs.push('birthday must be a valid date (e.g., YYYY-MM-DD)');

  if (errs.length) {
    const e = new Error(errs.join('; '));
    e.status = 400; // rubric: return 400 for validation failures
    throw e;
  }
}

// ---------- Routes ----------

// GET /contacts  (all)
router.get('/', async (_req, res) => {
  try {
    const docs = await getDb().collection(COLLECTION).find().toArray();
    res.status(200).json(docs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch contacts' });
  }
});

// GET /contacts/:id  (one)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid contact id' });

    const doc = await getDb().collection(COLLECTION).findOne({ _id: new ObjectId(id) });
    if (!doc) return res.status(404).json({ message: 'Contact not found' });

    res.status(200).json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch contact' });
  }
});

// POST /contacts  (create)
router.post('/', async (req, res) => {
  try {
    validateContact(req.body);

    const { insertedId } = await getDb().collection(COLLECTION).insertOne(req.body);
    const created = await getDb().collection(COLLECTION).findOne({ _id: insertedId });

    res.status(201).json(created); // rubric: 201 on create
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ message: err.message || 'Failed to create contact' });
  }
});

// PUT /contacts/:id  (replace/update)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid contact id' });

    validateContact(req.body);

    const result = await getDb().collection(COLLECTION).findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: req.body },
      { returnDocument: 'after' }
    );

    if (!result.value) return res.status(404).json({ message: 'Contact not found' });
    res.status(200).json(result.value);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ message: err.message || 'Failed to update contact' });
  }
});

// DELETE /contacts/:id  (remove)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid contact id' });
    }

    const del = await getDb()
      .collection(COLLECTION)
      .findOneAndDelete({ _id: new ObjectId(id) });

    // In MongoDB v6, findOneAndDelete returns the document OR null
    if (!del) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to delete contact' });
  }
});
