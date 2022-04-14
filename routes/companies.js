const express = require("express");
const { NotFoundError } = require("../expressError");

const db = require("../db");
const router = new express.Router();

/** GET /companies: get list of companies
 * @return {companies: [{code, name}, ...]}
 */
router.get("/", async function (req, res) {
  const results = await db.query(
    `SELECT code, name
              FROM companies
              ORDER BY code;`
  );
  const companies = results.rows;
  return res.json({ companies });
});

/** GET /companies/:code: get a single company and all their invoice id's
 * @return {company: {code, name, description, invoices: [id, ...]}}
 */
router.get("/:code", async function (req, res) {
  const code = req.params.code;

  const companyResults = await db.query(
    `SELECT code, name, description
              FROM companies
              WHERE code = $1`,
    [code]
  );
  const company = companyResults.rows[0];
  if (!company) throw new NotFoundError(`${code} cannot be found`);

  const invoiceResults = await db.query(
    `SELECT id
  FROM invoices
  WHERE comp_code = $1`,
    [company.code]
  );
  const invoices = invoiceResults.rows;
  company.invoices = invoices.map((el) => el.id);

  return res.json({ company });
});

/** POST /companies: add a company
 * @body {code, name, description}
 * @return {company: {code, name, description}}
 */
router.post("/", async function (req, res) {
  const { code, name, description } = req.body;

  const result = await db.query(
    `INSERT INTO companies (code, name, description)
           VALUES ($1, $2, $3)
           RETURNING code, name, description`,
    [code, name, description]
  );
  const company = result.rows[0];
  return res.status(201).json({ company });
});

/** PUT /companies/:code Update company, returning company
 * @body {name, description}
 * @return {company: {code, name, description}}
 */
router.put("/:code", async function (req, res) {
  const { name, description } = req.body;

  const result = await db.query(
    `UPDATE companies
           SET name=$1,
               description=$2
           WHERE code = $3
           RETURNING code, name, description`,
    [name, description, req.params.code]
  );
  const company = result.rows[0];
  if (!company) throw new NotFoundError(`${req.params.code} cannot be found`);
  return res.json({ company });
});

/** DELETE /companies/:code: delete company
 * @return {status: "deleted"}
 */
router.delete("/:code", async function (req, res) {
  const code = req.params.code;

  const result = await db.query(
    `DELETE FROM companies WHERE code = $1 RETURNING code`,
    [code]
  );
  const company = result.rows[0];
  if (!company) throw new NotFoundError(`${code} cannot be found`);
  return res.json({ status: "deleted" });
});

module.exports = router;
