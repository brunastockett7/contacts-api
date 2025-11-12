const express = require('express');
const { ObjectId } = require('mongodb');
const { getDb } = require('../db/connect');
const router = express.Router();

function validateCompany(b) {
  const errs = [];
  if (!b.name || typeof b.name !== 'string') errs.push('name required (string)');
  if (b.domain && typeof b.domain !== 'string') errs.push('domain must be string');
  if (errs.length) { const e = new Error(errs.join('; ')); e.status = 400; throw e; }
}

router.get('/', async (_req, res, next) => {
  try { res.json(await getDb().collection('companies').find().toArray()); }
  catch (e) { next(e); }
});
router.get('/:id', async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(404).json({ error: 'NotFound' });
    const doc = await getDb().collection('companies').findOne({_id:new ObjectId(req.params.id)});
    if (!doc) return res.status(404).json({ error: 'NotFound' });
    res.json(doc);
  } catch (e) { next(e); }
});
router.post('/', async (req, res, next) => {
  try {
    validateCompany(req.body);
    const { insertedId } = await getDb().collection('companies').insertOne(req.body);
    res.status(201).json(await getDb().collection('companies').findOne({_id:insertedId}));
  } catch (e) { next(e); }
});
router.put('/:id', async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(404).json({ error: 'NotFound' });
    validateCompany(req.body);
    const r = await getDb().collection('companies').findOneAndUpdate(
      { _id: new ObjectId(req.params.id) }, { $set: req.body }, { returnDocument: 'after' }
    );
    if (!r.value) return res.status(404).json({ error: 'NotFound' });
    res.json(r.value);
  } catch (e) { next(e); }
});
router.delete('/:id', async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(404).json({ error: 'NotFound' });
    const r = await getDb().collection('companies').deleteOne({ _id:new ObjectId(req.params.id) });
    if (!r.deletedCount) return res.status(404).json({ error: 'NotFound' });
    res.status(204).send();
  } catch (e) { next(e); }
});

module.exports = router;
