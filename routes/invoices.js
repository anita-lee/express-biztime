const express = require("express");
const { NotFoundError } = require("../expressError");

const db = require("../db");
const router = new express.Router();

/** GET /invoices: get list of invoices
 * @return {invoices: [{id, comp_code}, ...]}
 */
router.get("/", async function (req, res) {
  const results = await db.query(
    `SELECT id, comp_code
                FROM invoices
                ORDER BY comp_code;`
  );
  const invoices = results.rows;

  return res.json({ invoices });
});

// /** GET /invoices/:id: get a single invoices by code in url
//  * @return {invoice: {id, amt, paid, add_date, paid_date,
//  * company: {code, name, description}}}
//  */
// router.get("/:id", async function (req, res) {
//   const id = req.params.id;

//   const results = await db.query(
//     `SELECT id, amt, paid, add_date, paid_date,
//     c.name, c.description, c.code
//                 FROM invoices AS i
//                 JOIN companies AS c ON i.comp_code = c.code
//                 WHERE id = $1`,
//     [id]
//   );
//   const result = results.rows[0];
//   if (!result) throw new NotFoundError(`Invoice #${id} cannot be found.`);

//   const invoice = {
//     id: result.id,
//     amt: result.amt,
//     paid: result.paid,
//     add_date: result.add_date,
//     paid_date: result.paid_date,
//     company: {
//       code: result.code,
//       name: result.name,
//       description: result.description,
//     },
//   };

//   return res.json({ invoice });
// });

/** GET /invoices/:id: get a single invoices by code in url
 * @return {invoice: {id, amt, paid, add_date, paid_date,
 * company: {code, name, description}}}
 */
router.get("/:id", async function (req, res) {
  const id = req.params.id;

  const invoiceResult = await db.query(
    `SELECT id, comp_code, amt, paid, add_date, paid_date
                FROM invoices 
                WHERE id = $1`,
    [id]
  );
  const invoice = invoiceResult.rows[0];
  if (!invoice) throw new NotFoundError(`Invoice #${id} cannot be found.`);

  const companyResult = await db.query(
    `SELECT code, name, description
              FROM companies
              WHERE code = $1`,
    [invoice.comp_code]
  );
  const company = companyResult.rows[0];
  invoice.company = company;
  delete invoice.comp_code;

  return res.json({ invoice });
});

/** POST /invoices: add a invoice
 * @body {comp_code, amt}
 * @return {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */
router.post("/", async function (req, res) {
  const { comp_code, amt } = req.body;

  const result = await db.query(
    `INSERT INTO invoices (comp_code, amt)
             VALUES ($1, $2)
             RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [comp_code, amt]
  );
  const invoice = result.rows[0];

  return res.status(201).json({ invoice });
});

/** PUT /invoices/:id Update invoice, return invoice
 * @body {amt}
 * @return {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */
router.put("/:id", async function (req, res) {
  const { amt } = req.body;

  const result = await db.query(
    `UPDATE invoices
             SET amt=$1
             WHERE id = $2
             RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [amt, req.params.id]
  );
  const invoice = result.rows[0];
  if (!invoice) {
    throw new NotFoundError(`Invoice #${req.params.id} cannot be found.`);
  }

  return res.json({ invoice });
});

/** DELETE /invoices/:id: delete invoice
 * @return {status: "deleted"}
 */
router.delete("/:id", async function (req, res) {
  const id = req.params.id;

  const result = await db.query(
    `DELETE FROM invoices WHERE id = $1 RETURNING id`,
    [id]
  );
  const invoice = result.rows[0];
  if (!invoice) throw new NotFoundError(`Invoice #${id} cannot be found.`);

  return res.json({ status: "deleted" });
});

module.exports = router;
