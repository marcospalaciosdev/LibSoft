import pool from '../../config/db';
import { auditApi } from '../audit/audit.api';

import { getPropertiesEquality } from "../../../../shared/utils/src/getPropertiesEquality";

const borrowerColumns = `
  id,
  dni,
  first_name,
  last_name,
  email,
  phone,
  gender,
  status,
  address,
  TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at
`;

const getBorrowerRawState = async (id: string) => {
  const result = await pool.query(
    `SELECT ${borrowerColumns} FROM borrowers WHERE id = $1`,
    [id]
  );
  return result.rows[0];
}

export const getBorrowers = async (params?: {
  name?: string;
  surname?: string;
  dni?: string;
  limit?: number;
  offset?: number;
  status?: 'all' | 'enabled' | 'disabled' | 'withDebt';
}) => {
  let query = `SELECT ${borrowerColumns} FROM borrowers WHERE 1=1`;
  const values: any[] = [];

  if (params?.name && params.name !== 'undefined') {
    values.push(`%${params.name}%`);
    query += ` AND (first_name ILIKE $${values.length} OR last_name ILIKE $${values.length})`;
  }

  if (params?.surname && params.surname !== 'undefined') {
    values.push(`%${params.surname}%`);
    query += ` AND last_name ILIKE $${values.length}`;
  }

  if (params?.dni) {
    values.push(`%${params.dni}%`);
    query += ` AND dni ILIKE $${values.length}`;
  }

  if (params?.status && params.status !== 'all') {
    values.push(params.status);
    query += ` AND status = $${values.length}`;
  }

  query += ` ORDER BY id ASC`;

  if (params?.limit) {
    values.push(params.limit);
    query += ` LIMIT $${values.length}`;
  }

  if (params?.offset !== undefined) {
    values.push(params.offset);
    query += ` OFFSET $${values.length}`;
  }

  const dataResult = await pool.query(query, values);

  let countQuery = 'SELECT COUNT(*) FROM borrowers WHERE 1=1';
  const countValues: any[] = [];
  if (params?.name && params.name !== 'undefined') {
    countValues.push(`%${params.name}%`);
    countQuery += ` AND (first_name ILIKE $${countValues.length} OR last_name ILIKE $${countValues.length})`;
  }
  if (params?.surname && params.surname !== 'undefined') {
    countValues.push(`%${params.surname}%`);
    countQuery += ` AND last_name ILIKE $${countValues.length}`;
  }
  if (params?.dni) {
    countValues.push(`%${params.dni}%`);
    countQuery += ` AND dni ILIKE $${countValues.length}`;
  }
  if (params?.status && params.status !== 'all') {
    countValues.push(params.status);
    countQuery += ` AND status = $${countValues.length}`;
  }

  const countResult = await pool.query(countQuery, countValues);

  return {
    data: dataResult.rows,
    total: parseInt(countResult.rows[0].count, 10)
  };
};

export const getBorrowerById = async (id: string) => {
  const result = await pool.query(`SELECT ${borrowerColumns} FROM borrowers WHERE id = $1`, [id]);

  return result.rows[0];
};

export const updateBorrower = async (id: string, borrower: any) => {
  const { firstName, lastName, name, surname, dni, email, phone, address, status } = borrower;
  const updateFirstName = firstName ?? name;
  const updateLastName = lastName ?? surname;

  const oldBorrower = await getBorrowerRawState(id);

  const result = await pool.query(
    `UPDATE borrowers
     SET first_name = $1,
         last_name = $2,
         dni = $3,
         email = $4,
         phone = $5,
         address = $6,
         status = $7
     WHERE id = $8
     RETURNING ${borrowerColumns}`,
    [updateFirstName, updateLastName, dni, email, phone, address, status, id]
  );

  const updatedBorrower = await getBorrowerRawState(id);

  auditApi.log({
    action: 'UPDATE',
    module: 'borrowers',
    entityId: id,
    newValues: updatedBorrower,
    oldValues: oldBorrower,
    metadata: {
      changedFields: getPropertiesEquality(
        oldBorrower,
        updatedBorrower,
        {
          mode: 'diff'
        }
      )
    }
  });

  return result.rows[0];
};

export const deleteBorrower = async (id: string) => {
  const result = await pool.query('DELETE FROM borrowers WHERE id = $1 RETURNING *', [id]);

  return result.rows[0];
};

export const getBorrowersAmount = async () => {
  const result = await pool.query('SELECT COUNT(*) FROM borrowers');
  return result.rows[0].count;
};

export const createBorrower = async (borrower: any) => {
  const result = await pool.query(
    'INSERT INTO borrowers (first_name, last_name, dni, email, phone, address, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW() AT TIME ZONE \'UTC\') RETURNING id, dni, first_name, last_name, email, phone, status, address, created_at',
    [borrower.firstName, borrower.lastName, borrower.dni, borrower.email, borrower.phone, borrower.address]
  );

  auditApi.log({
    action: 'CREATE',
    module: 'borrowers',
    entityId: result.rows[0].id,
    newValues: result.rows[0],
  });

  return result.rows[0];
}
