import pool from '../../config/db';
import { Request } from 'express';

import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

import type {
  Loan,
  LoanDetail,
  CreateLoanDTO,
  GetLoanSummaryMetricsParams
} from "@LibSoft/shared-types";
import { PoolClient } from 'pg';
import { auditApi } from '../audit/audit.api';

import { GetLoansParams } from '@LibSoft/shared-types';

export const checkCopiesAvailability = async (copyIds: number[], client: any = pool): Promise<void> => {

  if (!copyIds.length) return;

  const borrowedCopies = await prisma.loans_copies.findMany({
    where: {
      copy_id: { in: copyIds },
      return_date: null
    },
    select: { copy_id: true }
  });

  if (borrowedCopies.length > 0) {
    const copiasOcupadas = borrowedCopies.map((r) => r.copy_id).join(', ');
    throw new Error(`Las siguientes copias ya están bajo un préstamo activo: ${copiasOcupadas}`);
  }
};

export const getLoans = async (params: GetLoansParams = {}) => {
  const {
    limit = 10,
    offset = 0,
    borrowerIds,
    copiesIds,
    borrowerName,
    status,
    sortBy = 'loanDate',
    startDate,
    endDate,
  } = params;

  console.log("getLoansParams: ", params);

  const now = new Date();

  const where: Prisma.loansWhereInput = {};

  if (borrowerName) {
    where.borrowers = {
      OR: [
        { first_name: { contains: borrowerName, mode: 'insensitive' } },
        { last_name: { contains: borrowerName, mode: 'insensitive' } },
      ],
    };
  }

  if (borrowerIds && borrowerIds.length > 0) where.borrower_id = { in: borrowerIds.map(Number) };

  if (copiesIds && copiesIds.length > 0) {
    where.loans_copies = {
      some: {
        copy_id: { in: copiesIds.map(Number) },
      },
    };
  }

  if (startDate || endDate) {
    where.loan_date = {
      ...(startDate && { gte: startDate }),
      ...(endDate && { lte: endDate }),
    };
  }

  if (status === 'returned') {
    where.loans_copies = {
      ...where.loans_copies,
      every: { return_date: { not: null } },
    };
  } else if (status === 'overdue') {
    where.due_date = { lt: now };
    where.loans_copies = {
      ...where.loans_copies,
      some: { return_date: null },
    };
  } else if (status === 'active') {
    where.due_date = { gte: now };
    where.loans_copies = {
      ...where.loans_copies,
      some: { return_date: null },
    };
  }

  let orderBy: Prisma.loansOrderByWithRelationInput = { loan_date: 'desc' };
  if (sortBy === 'dueDate') {
    orderBy = { due_date: 'desc' };
  } else if (sortBy === 'totalCopies') {
    orderBy = { loans_copies: { _count: 'desc' } };
  }

  const [totalCount, rawLoans] = await Promise.all([
    prisma.loans.count({ where }),
    prisma.loans.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy,
      include: {
        borrowers: true,
        loans_copies: {
          include: {
            book_copies: {
              include: {
                books: {
                  select: { title: true },
                },
              },
            },
          },
        },
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          }
        }
      },
    }),
  ]);

  const data = rawLoans.map((loan) => {
    const bookTitles = Array.from(
      new Set(
        loan.loans_copies
          .map((lc) => lc.book_copies?.books?.title)
          .filter((title): title is string => Boolean(title))
      )
    ).join(', ');

    const isReturned = loan.loans_copies.every((lc) => lc.return_date !== null);
    const isOverdue = !isReturned && loan.due_date ? loan.due_date < now : false;
    const computedStatus = isReturned ? 'returned' : isOverdue ? 'overdue' : 'active';

    const maxReturnDate = loan.loans_copies.reduce<Date | null>((max, lc) => {
      if (!lc.return_date) return max;
      return !max || lc.return_date > max ? lc.return_date : max;
    }, null);

    return {
      id: loan.id.toString(),
      books_title: bookTitles,
      borrower_id: loan.borrowers?.id.toString() ?? null,
      borrower_name: loan.borrowers
        ? `${loan.borrowers.first_name} ${loan.borrowers.last_name ?? ''}`.trim()
        : '',
      user: {
        id: loan.users?.id.toString() ?? null,
        firstName: loan.users?.first_name ?? '',
        lastName: loan.users?.last_name ?? '',
      },
      loan_date: loan.loan_date ? loan.loan_date.toISOString() : null,
      due_date: loan.due_date ? loan.due_date.toISOString() : null,
      return_date: maxReturnDate ? maxReturnDate.toISOString() : null,
      type: loan.type,
      total_copies: loan.loans_copies.length,
      status: computedStatus,
      total_count: totalCount,
    };
  });

  return data;
};

export const getLoansByCopyId = async (copyId: number) => {
}

export const getLoansCount = async (): Promise<{ total: number }> => {
  const loansAmount = await pool.query(`SELECT COUNT(*) FROM public.loans`);
  return { total: loansAmount.rows[0].count };
};

export const createLoan = async (
  data: CreateLoanDTO,
  userId: string,
  req: Request
): Promise<LoanDetail> => {
  const { borrowerId, itemsIds, loanDate, dueDate, additionalInfo } = data;

  try {
    const newLoanId = await prisma.$transaction(async (tx) => {
      const borrowerExists = await tx.borrowers.findUnique({
        select: { id: true, status: true },
        where: { id: BigInt(borrowerId) },
      });

      if (!borrowerExists) {
        throw new Error(`Borrower with ID ${borrowerId} does not exist`);
      }
      if (borrowerExists.status === 'disabled') {
        throw new Error(`Borrower with ID ${borrowerId} is disabled`);
      }

      const createdHeader = await tx.loans.create({
        data: {
          borrower_id: BigInt(borrowerId),
          loan_date: new Date(loanDate),
          due_date: new Date(dueDate),
          description: additionalInfo || null,
          type: data.type || null,
          user_id: userId,
        },
      });

      for (const item of itemsIds) {
        const { id: bookId, quantity, copyIds } = item;
        let selectedCopies: { copy_id: number }[] = [];

        if (copyIds && copyIds.length > 0) {
          selectedCopies = await tx.book_copies.findMany({
            where: {
              book_id: BigInt(bookId),
              copy_id: { in: copyIds.map((id) => Number(id)) },
              loans_copies: {
                none: { return_date: null },
              },
            },
            select: { copy_id: true },
          });

          if (selectedCopies.length !== copyIds.length) {
            throw new Error(
              `One or more requested copies of book ID ${bookId} are not available`
            );
          }
        } else {
          selectedCopies = await tx.book_copies.findMany({
            where: {
              book_id: BigInt(bookId),
              loans_copies: {
                none: { return_date: null },
              },
            },
            take: Number(quantity),
            select: { copy_id: true },
          });

          if (selectedCopies.length < Number(quantity)) {
            throw new Error(
              `Not enough available copies for book ID ${bookId}. Requested: ${quantity}, Available: ${selectedCopies.length}`
            );
          }
        }

        for (const copy of selectedCopies) {
          await tx.loans_copies.create({
            data: {
              loan_id: createdHeader.id,
              copy_id: copy.copy_id,
              returned: false,
            },
          });

          await tx.book_copies.update({
            where: { copy_id: copy.copy_id },
            data: { isavailable: false },
          });
        }
      }

      return createdHeader.id;
    });

    const createdLoan = await getLoanById(newLoanId.toString(), 'es');
    if (!createdLoan) throw new Error(`Error while returning loan`);

    auditApi.log({
      action: 'CREATE',
      module: 'loans',
      entityId: createdLoan.id,
      newValues: createdLoan,
    });

    return createdLoan;
  } catch (error) {
    throw error;
  }
};

export const getLoanById = async (
  id: string,
  lang?: string | null,
  client?: PoolClient
): Promise<LoanDetail> => {

  const db = client || pool;

  const query = `
        SELECT
          l.id,
          to_char(l.loan_date, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS loan_date,
          to_char(l.due_date, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS due_date,
          json_build_object(
              'id', bor.id,
              'firstName', bor.first_name,
              'lastName', bor.last_name,
              'dni', bor.dni,
              'email', bor.email,
              'phone', bor.phone,
              'address', bor.address,
              'gender', bor.gender,
              'status', bor.status,
              'createdAt', bor.created_at
          ) AS borrower,
              (
                SELECT json_build_object(
                  'id', u.id,
                  'username', u.username,
                  'firstName', u.first_name,
                  'lastName', u.last_name,
                  'email', u.email
                )
                FROM public.users u
                WHERE u.id = l.user_id
              ) AS created_by,
          l.type,
          CASE
              WHEN BOOL_AND(lc.return_date IS NOT NULL) THEN 'returned'
              WHEN (l.due_date AT TIME ZONE 'UTC') < NOW() THEN 'overdue'
              ELSE 'active'
          END AS status,
          (
              SELECT json_agg(item_group.item ORDER BY item_group.title ASC)
              FROM (
                  SELECT 
                      json_build_object(
                          'id', b.id,
                          'title', b.title,
                          'author', b.author,
                          'year', EXTRACT(YEAR FROM b.edition_date),
                          'category', COALESCE(dct.name, dc.code::text),
                          'copies', json_agg(
                              json_build_object(
                                  'id', c.copy_id,
                                  'inventoryNumber', c.inventory_number,
                                  'returned', lc.returned,
                                  'returnDate', to_char(lc.return_date, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
                              ) ORDER BY c.inventory_number ASC
                          )
                      ) as item,
                      b.title
                  FROM public.loans_copies lc
                  INNER JOIN public.book_copies c ON lc.copy_id = c.copy_id
                  INNER JOIN public.books b ON c.book_id = b.id
                  LEFT JOIN public.dewey_classifications dc ON b.dewey_category_id = dc.code
                  LEFT JOIN public.dewey_classifications_translations dct 
                      ON dc.code = dct.dewey_classification_id 
                     AND $1::text IS NOT NULL 
                     AND dct.lang_code = $1
                  WHERE lc.loan_id = l.id
                  GROUP BY b.id, b.title, b.author, b.edition_date, dc.code, dct.name
              ) item_group
          ) AS items
      FROM 
          public.loans l
      INNER JOIN 
          public.loans_copies lc ON l.id = lc.loan_id
      INNER JOIN 
          public.borrowers bor ON l.borrower_id = bor.id
      WHERE l.id = $2
      GROUP BY 
          l.id, 
          bor.id, 
          bor.first_name, 
          bor.last_name, 
          bor.dni, 
          bor.email, 
          bor.phone, 
          bor.address,
          bor.gender,
          bor.status, 
          bor.created_at,
          l.loan_date, 
          l.due_date, 
          l.type;
    `;

  // Pasamos lang (o null) explícitamente a la query
  const result = await db.query(query, [lang ?? null, id]);
  return result.rows[0];
};

const getCopiesByLoanId = async (id: string, client?: PoolClient) => {

  const db = client || pool;

  const query = `
    SELECT * FROM public.loans_copies WHERE loan_id = $1
  `;

  const result = await db.query(query, [id]);
  return result.rows;
}

export const returnLoan = async (
  loanId: string,
  copiesData?: number[] | { copyId: number; returned: boolean; }[]
) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const copiesOldState = await getCopiesByLoanId(loanId, client);

    const loanCheck = await client.query(
      `SELECT id FROM public.loans WHERE id = $1`,
      [loanId]
    );
    if (loanCheck.rows.length === 0) throw new Error('Préstamo no encontrado')

    if (copiesData && copiesData.length > 0) {

      if (typeof copiesData[0] === 'number') {
        const copyIds = copiesData as number[];

        await client.query(
          `UPDATE public.loans_copies
           SET returned = true,
               return_date = NOW() AT TIME ZONE 'UTC'
           WHERE loan_id = $1 AND copy_id = ANY($2)`,
          [loanId, copyIds]
        );

        await client.query(
          `UPDATE public.book_copies
           SET isavailable = true
           WHERE copy_id = ANY($1)`,
          [copyIds]
        );
      } else {
        const copies = copiesData as { copyId: number; returned: boolean; returnDate: string | null }[];
        for (const copy of copies) {
          const { copyId, returned, returnDate } = copy;

          await client.query(
            `UPDATE public.loans_copies
             SET returned = $1,
                 return_date = NOW() AT TIME ZONE 'UTC'
             WHERE loan_id = $2 AND copy_id = $3`,
            [returned, loanId, copyId]
          );

          await client.query(
            `UPDATE public.book_copies
             SET isavailable = $1
             WHERE copy_id = $2`,
            [returned, copyId]
          );
        }
      }
    } else {

      await client.query(
        `UPDATE public.loans_copies
         SET returned = true,
             return_date = NOW() AT TIME ZONE 'UTC'
         WHERE loan_id = $1 AND returned = false`,
        [loanId]
      );
      await client.query(
        `UPDATE public.book_copies
         SET isavailable = true
         FROM public.loans_copies lc
         WHERE public.book_copies.copy_id = lc.copy_id
           AND lc.loan_id = $1`,
        [loanId]
      );
    }

    await client.query('COMMIT');

    const result = await pool.query(
      `SELECT l.*, BOOL_AND(lc.returned) as fully_returned
       FROM public.loans l
       JOIN public.loans_copies lc ON l.id = lc.loan_id
       WHERE l.id = $1
       GROUP BY l.id`,
      [loanId]
    );

    const finalCopiesState = await getCopiesByLoanId(loanId, client);

    auditApi.log({
      module: "loans",
      action: "RETURN",
      entityId: loanId,
      oldValues: copiesOldState,
      newValues: finalCopiesState
    })

    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getReturnMetricsByMonth = async (
  monthsBack: String
) => {

  console.log(monthsBack, 'monthsBack');

  const query = `
      SELECT * FROM (
        SELECT 
            LOWER(TO_CHAR(DATE_TRUNC('month', l.loan_date), 'FMMonth')) AS month,
            DATE_TRUNC('month', l.loan_date) AS month_date,
            
            COUNT(*) FILTER (
                WHERE lc.returned = true AND lc.return_date <= l.due_date
            ) AS returned_on_time,
            
            COUNT(*) FILTER (
                WHERE lc.returned = true AND lc.return_date > l.due_date
            ) AS returned_late,
            
            COUNT(*) FILTER (
                WHERE lc.returned = false OR lc.returned IS NULL
            ) AS not_returned,
            
            COUNT(*) AS total_loans

        FROM 
            public.loans l
        INNER JOIN 
            public.loans_copies lc ON l.id = lc.loan_id

        GROUP BY 
            DATE_TRUNC('month', l.loan_date),
            LOWER(TO_CHAR(DATE_TRUNC('month', l.loan_date), 'FMMonth'))
        ORDER BY 
            DATE_TRUNC('month', l.loan_date) DESC
        LIMIT $1::int  -- Devolverá estrictamente los últimos N meses encontrados
    ) subquery
    ORDER BY month_date ASC;
    `;
  const result = await pool.query(query, [monthsBack]);
  return result.rows;
};

export const getLoanSummaryMetrics = async (params: GetLoanSummaryMetricsParams) => {

  const { borrowerId, startDate, endDate } = params;

  const query = `
    WITH loan_stats AS (
      SELECT
        l.id,
        l.type,
        (l.due_date AT TIME ZONE 'UTC') AT TIME ZONE 'America/Argentina/Buenos_Aires' AS due_date,
        BOOL_AND(lc.return_date IS NOT NULL) AS fully_returned,
        MAX(lc.return_date) AS max_return_date
      FROM public.loans l
      INNER JOIN public.loans_copies lc ON l.id = lc.loan_id
      WHERE 1=1
        AND ($1::int IS NULL OR l.borrower_id = $1)
        AND ($2::timestamp IS NULL OR l.loan_date >= $2)
        AND ($3::timestamp IS NULL OR l.loan_date <= $3)
      GROUP BY l.id, l.type, l.due_date
    )
    SELECT
      COUNT(*) AS total_loans,
      COUNT(*) FILTER (WHERE NOT fully_returned AND due_date >= NOW()) AS active_loans,
      COUNT(*) FILTER (
        WHERE fully_returned
          AND ((max_return_date AT TIME ZONE 'UTC') AT TIME ZONE 'America/Argentina/Buenos_Aires') >= DATE_TRUNC('day', (NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'America/Argentina/Buenos_Aires')
          AND ((max_return_date AT TIME ZONE 'UTC') AT TIME ZONE 'America/Argentina/Buenos_Aires') < DATE_TRUNC('day', (NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'America/Argentina/Buenos_Aires') + INTERVAL '1 day'
      ) AS returns_today,
      COUNT(*) FILTER (WHERE NOT fully_returned AND due_date < NOW()) AS overdue_loans,
      COUNT(*) FILTER (
        WHERE NOT fully_returned
          AND type = 'domiciliary'
          AND due_date >= NOW()
          AND due_date <= NOW() + INTERVAL '1 day'
      ) AS due_soon_domiciliary_loans,
      COUNT(*) FILTER (WHERE fully_returned AND ((max_return_date AT TIME ZONE 'UTC') AT TIME ZONE 'America/Argentina/Buenos_Aires') <= due_date) AS returned_on_time,
      COUNT(*) FILTER (WHERE fully_returned) AS total_returned,
      CASE WHEN COUNT(*) FILTER (WHERE fully_returned) = 0 THEN 0
        ELSE ROUND(100.0 * COUNT(*) FILTER (WHERE fully_returned AND ((max_return_date AT TIME ZONE 'UTC') AT TIME ZONE 'America/Argentina/Buenos_Aires') <= due_date) / NULLIF(COUNT(*) FILTER (WHERE fully_returned), 0))
      END AS punctuality_rate
    FROM loan_stats;

  `;

  const values = [borrowerId || null, startDate || null, endDate || null];

  const result = await pool.query(query, values);

  return result.rows[0];
};


export const deleteLoan = async (id: string) => {
  try {

    const existingLoans = await pool.query(`SELECT id FROM public.loans WHERE id = $1`, [id]);

    if (!existingLoans.rows.length) throw new Error(`El préstamo con ID ${id} no existe.`);

    const loan = await getLoanById(id);

    const client = await pool.connect();
    await client.query('BEGIN');

    try {
      await client.query(
        `DELETE FROM public.loans_copies WHERE loan_id = $1`,
        [id]
      )

      await client.query(
        `DELETE FROM public.loans WHERE id = $1`,
        [id]
      );

      auditApi.log({
        module: 'loans',
        action: 'DELETE',
        entityId: id,
        oldValues: loan,
        newValues: null,
      });

      await client.query('COMMIT');
      return { success: true, message: `Préstamo ${id} eliminado correctamente.` };

    } catch (error) {

      await client.query('ROLLBACK');
      console.error(`Error eliminando préstamo ${id}:`, error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error(`Error en deleteLoan service:`, error.message);
    throw error;
  }
};

export const deleteCopiesBulkService = async (copyId: number) => {
  try {

    const affectedLoanIds = await prisma.loans_copies.findMany({
      where: { copy_id: copyId },
      select: { loan_id: true },
    });

    const parsedIds = affectedLoanIds.map((l) => Number(l.loan_id));

    console.log(parsedIds, 'parsedIds');

    if (parsedIds.length === 0) return;

    await prisma.loans.deleteMany({
      where: { id: { in: parsedIds } },
    });

    return { success: true, message: `Copias eliminadas correctamente.` };
  } catch (error: any) {
    throw error;
  }
};

