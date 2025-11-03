const express = require('express');
const { ObjectId } = require('mongodb');
const { getDb } = require('../db/connect');


const router = express.Router();


// GET all contacts
router.get('/', async (req, res) => {
try {
const contacts = await getDb().collection('contacts').find().toArray();
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
if (!ObjectId.isValid(id)) {
return res.status(400).json({ message: 'Invalid contact id' });
}


const contact = await getDb()
.collection('contacts')
.findOne({ _id: new ObjectId(id) });


if (!contact) return res.status(404).json({ message: 'Contact not found' });


res.status(200).json(contact);
} catch (err) {
console.error(err);
res.status(500).json({ message: 'Failed to fetch contact' });
}
});


module.exports = router;