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
              ORDER BY code;`);
  const companies = results.rows;
  return res.json({ companies });
});

/** GET /companies/:code: get a single company by code in url
 * @return {company: {code, name, description}}
*/
router.get("/:code", async function (req, res) {
  const code = req.params.code;

  const results = await db.query(
    `SELECT code, name, description
              FROM companies
              WHERE code = $1`, [code]);
  const company = results.rows[0];
  if (!company) throw NotFoundError('Company cannot be found');
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
    [name, description, req.params.code],
  );
  const company = result.rows[0];
  if (!company) throw NotFoundError('Company cannot be found');
  return res.json({ company });
});

/** DELETE /companies/:code: delete company
 * @return {status: "deleted"}
*/
router.delete("/:code", async function (req, res) {
  const code = req.params.code;

  const result = await db.query(
    `DELETE FROM companies WHERE code = $1 RETURNING code`,
    [code],
  );
  const company = result.rows[0];
  if (!company) throw NotFoundError('Company cannot be found');
  return res.json({ status: "deleted" });
});

module.exports = router;