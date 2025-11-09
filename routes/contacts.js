// routes/contacts.js (CommonJS)
const express = require('express');
const { ObjectId } = require('mongodb');
const { getDb } = require('../db/connect');

const router = express.Router();
const COLLECTION = 'contacts';
const REQUIRED = ['firstName', 'lastName', 'email', 'favoriteColor', 'birthday'];

const hasAllFields = (body) => REQUIRED.every((k) => body?.[k]);

// GET all contacts
router.get('/', async (_req, res) => {
  try {
    const contacts = await getDb().collection(COLLECTION).find().toArray();
    res.status(200).json(contacts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch contacts' });
  }
});

// GET one contact by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid contact id' });

    const contact = await getDb().collection(COLLECTION).findOne({ _id: new ObjectId(id) });
    if (!contact) return res.status(404).json({ message: 'Contact not found' });

    res.status(200).json(contact);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch contact' });
  }
});

// POST create a contact (must include ALL required fields)
router.post('/', async (req, res) => {
  try {
    if (!hasAllFields(req.body)) {
      return res.status(400).json({ message: `All fields required: ${REQUIRED.join(', ')}` });
    }
    const { insertedId } = await getDb().collection(COLLECTION).insertOne(req.body);
    const created = await getDb().collection(COLLECTION).findOne({ _id: insertedId });
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create contact' });
  }
});

// PUT replace a contact (ALL fields required)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid contact id' });
    if (!hasAllFields(req.body)) {
      return res.status(400).json({ message: `All fields required: ${REQUIRED.join(', ')}` });
    }

    const result = await getDb().collection(COLLECTION).findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: req.body },
      { returnDocument: 'after' }
    );
    if (!result.value) return res.status(404).json({ message: 'Contact not found' });

    res.status(200).json(result.value);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update contact' });
  }
});

// DELETE a contact
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid contact id' });

    const del = await getDb().collection(COLLECTION).findOneAndDelete({ _id: new ObjectId(id) });
    if (!del.value) return res.status(404).json({ message: 'Contact not found' });

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete contact' });
  }
});

module.exports = router;
