import camelcaseKeys from 'camelcase-keys';
import pool from '../../config/db';
import { PoolClient } from 'pg';
import { Prisma, PrismaClient } from '@prisma/client';

import type {
  Book,
  BookDetail,
  BookDTO,
  EditBookDTO,
  BookCopy,
  CreateBookCopyDTO,
  DetailedBookCopyResponse,
  UnitsAmountByBookResponse,
  BookCategory,
  CategoryFrequencyResponse,
  GetBooksParams,
  GetCopiesParams,
  GetCategoriesFrequencyParams,
  GetUDCListParams,
  GetUDCAmountParams,
  DeweyClassificationDto,
  BorrowedMetrics,
  DeweyStatus
} from '@LibSoft/shared-types';

import { auditApi } from '../audit/audit.api';
import { getPropertiesEquality } from '../../../../shared/utils/src/getPropertiesEquality';

const prisma = new PrismaClient();

const getBookRawState = async (id: string, client?: PoolClient) => {
  const db = client || pool;

  const result = await db.query(`
    SELECT
      b.id,
      b.title,
      b.author,
      b.isbn,
      b.publisher,
      b.description,
      b.topographic_subject,
      b.edition_date,
      b.created_at,
      b.dewey_category_id
    FROM public.books b
    LEFT JOIN public.books_keywords bk ON b.id = bk.book_id
    LEFT JOIN public.keywords k ON bk.keyword_id = k.id
    WHERE b.id = $1
    GROUP BY b.id;
  `, [id]);

  if (!result.rows[0]) return null;
  return result.rows[0];
};

export const insertBook = async (data: BookDTO) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    if (data.topographicSubject?.trim()) {
      const duplicateCheck = await client.query(
        `SELECT id FROM books WHERE topographic_subject = $1 LIMIT 1`,
        [data.topographicSubject.trim()]
      );
      if (duplicateCheck.rows.length > 0) {
        const duplicateError = new Error('Ya existe una asignatura topográfica duplicada.');
        (duplicateError as any).code = 'DUPLICATE_TOPOGRAPHIC_SUBJECT';
        throw duplicateError;
      }
    }

    const query = `
        INSERT INTO books (title, author, isbn, dewey_category_id, edition_date, publisher, topographic_subject, description, created_at) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() AT TIME ZONE 'UTC') 
        RETURNING *
      `;

    const values = [
      data.title,
      data.author,
      data.isbn,
      data.udcId || null,
      data.editionDate || null,
      data.publisher || null,
      data.topographicSubject?.trim() || null,
      data.description || null,
    ];

    const result = await client.query(query, values);
    const newBook = result.rows[0];

    if (data.tags && Array.isArray(data.tags) && data.tags.length > 0) {
      for (const tag of data.tags) {
        const keyword = tag.trim().toLowerCase();
        if (!keyword) continue;

        const kwQuery = `
          INSERT INTO keywords (keyword) 
          VALUES ($1) 
          ON CONFLICT (keyword) DO UPDATE SET keyword = EXCLUDED.keyword 
          RETURNING id
        `;
        const kwResult = await client.query(kwQuery, [keyword]);
        const keywordId = kwResult.rows[0].id;

        const bkQuery = `
          INSERT INTO books_keywords (book_id, keyword_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `;
        await client.query(bkQuery, [newBook.id, keywordId]);
      }
    }

    await client.query('COMMIT');

    const book = await getBookRawState(String(newBook.id));

    auditApi.log({
      action: 'CREATE',
      module: 'books',
      entityId: String(newBook.id),
      newValues: book
    });

    return book;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getBooks = async (params?: GetBooksParams): Promise<Book[]> => {

  const lang = params?.lang === undefined ? 'en' : (params.lang || null);
  const values: any[] = [lang];

  let query = `
    SELECT 
        b.id,
        b.title,
        b.author,
        b.isbn,
        b.edition_date,
        CASE 
            WHEN $1::text IS NULL THEN b.dewey_category_id::text
            ELSE COALESCE(t_lang.name, t_en.name, c.code::text)
        END AS category,
        COUNT(DISTINCT bc.copy_id) AS total_copies,
        COUNT(DISTINCT CASE WHEN lc.returned = false THEN bc.copy_id END) AS borrowed_copies,
        (COUNT(DISTINCT bc.copy_id) - COUNT(DISTINCT CASE WHEN lc.returned = false THEN bc.copy_id END)) AS copies_available
    FROM 
        public.books b
    LEFT JOIN 
        public.dewey_classifications c 
        ON b.dewey_category_id = c.code 
    LEFT JOIN 
        public.dewey_classifications_translations t_lang 
        ON $1::text IS NOT NULL AND c.code = t_lang.dewey_classification_id AND t_lang.lang_code = $1 
    LEFT JOIN 
        public.dewey_classifications_translations t_en 
        ON $1::text IS NOT NULL AND c.code = t_en.dewey_classification_id AND t_en.lang_code = 'en' 
    LEFT JOIN 
        public.book_copies bc ON b.id = bc.book_id
    LEFT JOIN
        public.loans_copies lc ON bc.copy_id = lc.copy_id
    WHERE 1=1
  `;

  if (params?.title) {
    values.push(`%${params.title}%`);
    query += ` AND b.title ILIKE $${values.length}`;
  }

  if (params?.isbn) {
    values.push(`%${params.isbn}%`);
    query += ` AND b.isbn ILIKE $${values.length}`;
  }

  if (params?.categoryId) {
    values.push(params.categoryId);
    query += ` AND b.dewey_category_id = $${values.length}`;
  }

  query += `
    GROUP BY 
        b.id, 
        b.title, 
        b.author, 
        b.isbn, 
        b.edition_date, 
        t_lang.name, 
        t_en.name, 
        c.code
  `;

  if (params?.sortBy) {
    const allowedSortColumns = ['id', 'title', 'author', 'isbn', 'category', 'total_copies', 'copies_available', 'createdAt'];

    const sortCol = params.sortBy === 'category'
      ? `CASE WHEN $1::text IS NULL THEN b.dewey_category_id::text ELSE COALESCE(t_lang.name, t_en.name, c.code::text) END`
      : allowedSortColumns.includes(params.sortBy) ? `b.${params.sortBy}` : 'b.id';

    const sortOrder = params?.order?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    query += ` ORDER BY ${sortCol} ${sortOrder}`;
  } else {
    query += ` ORDER BY b.id ASC`;
  }

  if (params?.limit) {
    values.push(params.limit);
    query += ` LIMIT $${values.length}`;
  }

  if (params?.offset) {
    values.push(params.offset);
    query += ` OFFSET $${values.length}`;
  }

  const result = await pool.query(query, values);
  return camelcaseKeys(result.rows);
};

export const getBookById = async (id: string, lang: string | null): Promise<BookDetail | null> => {

  console.log(" --- bookService.ts ---")
  console.log("Fetching book by id: ", id)
  console.log("Language: ", lang)

  const result = await pool.query(`
    SELECT
      b.id,
      b.title,
      b.author,
      b.isbn,
      b.edition_date,
      b.description,
      b.publisher,
      b.topographic_subject,
      b.created_at,
      
      CASE 
          WHEN $2::text IS NULL THEN b.dewey_category_id
          ELSE COALESCE(t.name, c.code::text)
      END AS category,

      CASE 
          WHEN $2::text IS NULL THEN 
              CASE 
                  WHEN b.dewey_category_id IS NOT NULL THEN 
                      jsonb_build_object('code', b.dewey_category_id)
                  ELSE NULL 
              END
          WHEN c.code IS NOT NULL THEN 
              jsonb_build_object(
                  'code', c.code,
                  'label', COALESCE(t.name, c.code::text)
              )
          ELSE NULL 
      END AS dewey_classification,
      COALESCE(
          array_agg(DISTINCT k.keyword) FILTER (WHERE k.keyword IS NOT NULL),
          ARRAY[]::text[]
      ) AS tags
    FROM books b
    LEFT JOIN dewey_classifications c 
        ON $2::text IS NOT NULL AND b.dewey_category_id = c.code
    LEFT JOIN dewey_classifications_translations t 
        ON $2::text IS NOT NULL AND c.code = t.dewey_classification_id AND t.lang_code = $2
    LEFT JOIN books_keywords bk 
        ON b.id = bk.book_id
    LEFT JOIN keywords k 
        ON bk.keyword_id = k.id
    WHERE b.id = $1
    GROUP BY b.id, t.name, c.code;
  `, [id, lang]);

  if (!result.rows[0]) return null;

  return camelcaseKeys(result.rows[0], { deep: true });
};

export const updateBook = async (id: string, data: EditBookDTO): Promise<BookDetail | null> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const oldValues = await getBookRawState(id, client);
    if (!oldValues) throw new Error('El libro no existe.');

    if (data.topographicSubject?.trim()) {
      const duplicateCheck = await client.query(
        `SELECT id FROM public.books WHERE topographic_subject = $1 AND id <> $2 LIMIT 1`,
        [data.topographicSubject.trim(), id]
      );
      if (duplicateCheck.rows.length > 0) {
        const duplicateError = new Error('Ya existe una asignatura topográfica duplicada.');
        (duplicateError as any).code = 'DUPLICATE_TOPOGRAPHIC_SUBJECT';
        throw duplicateError;
      }
    }

    const categoryId = (data.udcId || (data as any).categoryId || '').trim() || null;

    const result = await client.query(
      `UPDATE public.books SET title = $1, author = $2, isbn = $3, dewey_category_id = $4, publisher = $5, topographic_subject = $6, description = $7, edition_date = $8 WHERE id = $9 RETURNING *`,
      [
        data.title,
        data.author,
        data.isbn,
        categoryId,
        data.publisher || null,
        data.topographicSubject || null,
        data.description || null,
        data.editionDate || null,
        id,
      ]
    );

    const updatedBook = result.rows[0];

    if (Array.isArray(data.tags)) {
      const normalizedTags = Array.from(
        new Set(
          data.tags
            .map((tag: string) => tag.trim().toLowerCase())
            .filter((tag: string) => tag.length > 0)
        )
      );

      const keywordIds: number[] = [];

      for (const tag of normalizedTags) {
        const kwQuery = `
          INSERT INTO keywords (keyword)
          VALUES ($1)
          ON CONFLICT (keyword) DO NOTHING
          RETURNING id
        `;
        const kwResult = await client.query(kwQuery, [tag]);

        let keywordId: number;
        if (kwResult.rows.length > 0) {
          keywordId = kwResult.rows[0].id;
        } else {
          const selectResult = await client.query(`SELECT id FROM keywords WHERE keyword = $1`, [tag]);
          keywordId = selectResult.rows[0].id;
        }

        keywordIds.push(keywordId);
        await client.query(
          `INSERT INTO books_keywords (book_id, keyword_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [updatedBook.id, keywordId]
        );
      }

      if (keywordIds.length > 0) {
        await client.query(
          `DELETE FROM books_keywords WHERE book_id = $1 AND keyword_id <> ALL($2)`,
          [updatedBook.id, keywordIds]
        );
      } else {
        await client.query(`DELETE FROM books_keywords WHERE book_id = $1`, [updatedBook.id]);
      }
    }

    const newValues = await getBookRawState(id, client);

    auditApi.log({
      action: 'UPDATE',
      module: 'books',
      entityId: id,
      oldValues: oldValues,
      newValues: newValues,
      metadata: {
        changedFields: getPropertiesEquality(oldValues, newValues)
      }
    });

    await client.query('COMMIT');
    return await getBookById(id, null);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const deleteBook = async (id: string) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await getBookRawState(id, client);
    const book = result;
    if (!book) throw new Error('Book not found');

    const activeLoansCheck = await client.query(`
      SELECT 1 
      FROM public.loans_copies lc
      JOIN public.book_copies bc ON lc.copy_id = bc.copy_id
      WHERE bc.book_id = $1 AND lc.returned = false
      LIMIT 1
    `, [id]);

    if (activeLoansCheck.rows.length > 0) {
      const error = new Error('No se puede eliminar el libro porque tiene copias prestadas actualmente.');
      (error as any).code = 'BOOK_HAS_ACTIVE_LOANS';
      throw error;
    }

    await client.query(`DELETE FROM public.books_keywords WHERE book_id = $1;`, [id]);
    await client.query(`DELETE FROM public.books WHERE id = $1;`, [id]);
    await client.query('COMMIT');

    auditApi.log({
      action: 'DELETE',
      module: 'books',
      entityId: id,
      oldValues: book,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getBookUnitsAmount = async (bookId: string): Promise<UnitsAmountByBookResponse> => {
  const result = await pool.query(`
    SELECT 
      COUNT(*) as total, 
      (COUNT(CASE WHEN isavailable = true THEN 1 END)) as available_copies,
      (COUNT(CASE WHEN isavailable = false THEN 1 END)) as borrowed_copies
    FROM public.book_copies 
    WHERE book_id = $1
  `, [bookId]);

  return camelcaseKeys(result.rows[0], { deep: true });
};

export const insertCopy = async (params: CreateBookCopyDTO) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const query = `
        INSERT INTO public.book_copies (book_id, inventory_number, created_at) 
        VALUES ($1, $2, NOW() AT TIME ZONE 'UTC') 
        RETURNING *
      `;
    const values = [params.book_id, params.inventoryNumber];
    const result = await client.query(query, values);
    const newCopy = result.rows[0];

    auditApi.log({
      action: 'CREATE',
      module: 'book_copies',
      entityId: String(newCopy.copy_id),
      newValues: {
        copy_id: newCopy.copy_id,
        book_id: newCopy.book_id,
        inventory_number: newCopy.inventory_number,
        created_at: newCopy.created_at
      }
    });

    await client.query('COMMIT');
    return newCopy;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const checkCopyAvailability = async (inventory_number: string) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT EXISTS (
          SELECT 1 
          FROM book_copies 
          WHERE inventory_number = $1
      )`,
      [inventory_number]
    );

    return result.rows[0].exists;

  } finally {
    client.release();
  }
}

export const updateCopy = async (copy_id: string, inventoryNumber: string) => {

  const copyOldValues = await pool.query(`
    SELECT * FROM public.book_copies WHERE copy_id = $1;
  `, [copy_id]);

  const result = await pool.query(
    'UPDATE public.book_copies SET inventory_number = $1 WHERE copy_id = $2 RETURNING *',
    [inventoryNumber, copy_id]
  );

  const copyNewValues = await pool.query(`
    SELECT * FROM public.book_copies WHERE copy_id = $1;
  `, [copy_id]);

  auditApi.log({
    action: 'UPDATE',
    module: 'book_copies',
    entityId: String(copy_id),
    oldValues: copyOldValues.rows[0],
    newValues: copyNewValues.rows[0],
    metadata: {
      changedFields: getPropertiesEquality(
        copyOldValues.rows[0],
        copyNewValues.rows[0],
        {
          mode: 'diff'
        }
      )
    }
  });

  return result.rows[0];
};

export const deleteCopy = async (copy_id: string) => {
  try {
    const copyExists = await prisma.book_copies.findUnique({
      where: {
        copy_id: parseInt(copy_id),
      },
    });

    if (!copyExists) {
      throw new Error(`La copia con ID ${copy_id} no existe.`);
    }

    const activeLoans = await prisma.loans_copies.findFirst({
      where: {
        copy_id: parseInt(copy_id),
        returned: false,
      },
    });

    if (activeLoans) {
      throw new Error(
        `No se puede eliminar la copia ${copy_id} porque actualmente está prestada (tiene préstamos pendientes de devolución).`
      );
    }

    const loansResult = await prisma.loans_copies.findMany({
      where: {
        copy_id: parseInt(copy_id),
      },
    });

    await prisma.loans_copies.deleteMany({
      where: {
        copy_id: parseInt(copy_id),
      },
    });

    const deleteCopyResult = await prisma.book_copies.delete({
      where: {
        copy_id: parseInt(copy_id),
      },
    });

    const deletedCopy = deleteCopyResult;
    const loansHistory = loansResult;

    auditApi.log({
      action: 'DELETE',
      module: 'book_copies',
      entityId: copy_id,
      oldValues: {
        copyData: deletedCopy,
        loansHistory: loansHistory
      }
    });

    return deletedCopy;
  } catch (error) {
    throw error;
  }
};

export const deleteCopiesBulk = async (copy_ids: string[]): Promise<void> => {

  const parsedIds = copy_ids.map((id: string) => parseInt(id));

  try {
    const oldValues = await prisma.book_copies.findMany({
      where: {
        copy_id: {
          in: parsedIds,
        },
      },
    });

    await prisma.book_copies.deleteMany({
      where: {
        copy_id: {
          in: parsedIds,
        },
      },
    });

    oldValues.forEach((copy: any) => {
      auditApi.log({
        action: 'DELETE',
        module: 'book_copies',
        entityId: String(copy.copy_id),
        oldValues: {
          copy_id: copy.copy_id,
          book_id: copy.book_id,
          inventory_number: copy.inventory_number,
          created_at: copy.created_at,
          updated_at: copy.updated_at
        }
      });
    });

  } catch (error) {
    throw error;
  } finally {
  }
}

export const getCopiesByBookId = async (
  bookId: string | number,
  params?: GetCopiesParams
): Promise<BookCopy[]> => {
  const numericBookId = typeof bookId === 'string' ? parseInt(bookId, 10) : bookId;

  if (isNaN(numericBookId)) return [];

  const onlyAvailable = params?.onlyAvailable || false;

  let searchTerm = params?.searchTerm?.trim() ?? '';
  if (searchTerm === 'undefined' || searchTerm === 'null') searchTerm = '';

  const parsedLimit = params?.limit ? Math.max(1, parseInt(String(params.limit), 10)) : 10;
  const rawPage = params?.page ? parseInt(String(params.page), 10) : 0;
  const page = rawPage > 0 ? rawPage - 1 : 0;
  const offset = page * parsedLimit;

  const whereClause: any = {
    book_id: numericBookId,
    ...(searchTerm !== '' && {
      inventory_number: {
        contains: searchTerm,
        mode: 'insensitive',
      },
    }),
    ...(onlyAvailable && {
      loans_copies: {
        none: {
          return_date: null,
        },
      },
    }),
  };

  const copies = await prisma.book_copies.findMany({
    where: whereClause,
    orderBy: {
      created_at: 'asc',
    },
    take: parsedLimit,
    skip: offset,
    select: {
      copy_id: true,
      book_id: true,
      inventory_number: true,
      _count: {
        select: {
          loans_copies: true,
        },
      },
      loans_copies: {
        where: {
          return_date: null,
        },
        select: {
          copy_id: true,
        },
      },
    },
  });

  return copies.map((copy) => ({
    id: String(copy.copy_id),
    bookId: String(copy.book_id),
    inventoryNumber: copy.inventory_number,
    isAvailable: copy.loans_copies.length === 0,
    timesLoaned: copy._count.loans_copies,
  }));
};

export const getCopyDetails = async (
  id: string | number,
  lang: string = 'es'
): Promise<DetailedBookCopyResponse | null> => {
  const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
  if (isNaN(numericId)) return null;

  const [copyData, timesLoaned] = await Promise.all([
    prisma.book_copies.findUnique({
      where: { copy_id: numericId },
      select: {
        copy_id: true,
        book_id: true,
        inventory_number: true,
        books: {
          select: {
            title: true,
            author: true,
            isbn: true,
            description: true,
            publisher: true,
            topographic_subject: true,
            created_at: true,
            edition_date: true,
            dewey_classifications: {
              select: {
                code: true,
                dewey_classifications_translations: {
                  where: { lang_code: lang },
                  select: { name: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    }),
    prisma.loans_copies.count({
      where: { copy_id: numericId },
    }),
  ]);

  if (!copyData || !copyData.books) return null;

  const { books, ...copyInfo } = copyData;
  const { dewey_classifications, ...bookFields } = books;

  const dewey = dewey_classifications
    ? {
      code: dewey_classifications.code,
      name: dewey_classifications.dewey_classifications_translations[0]?.name ?? null,
    }
    : null;

  return {
    copyData: copyInfo,
    bookData: {
      ...bookFields,
      dewey_classification: dewey,
    },
    times_loaned: timesLoaned,
  };
};

export const getAmount = async (): Promise<number> => {
  const result = await prisma.books.count();
  return result;
};

export const getCategories = async (): Promise<BookCategory[]> => {
  const result = await pool.query(`
    SELECT
      c.code AS id, COALESCE(t.name, c.code::text) AS name
    FROM dewey_classifications c
    LEFT JOIN dewey_classifications_translations t ON c.code = t.dewey_classification_id AND t.lang_code = 'es'
    ORDER BY t.name ASC;
  `);
  return result.rows;
};

export const getCategoriesFrecuency = async (params?: GetCategoriesFrequencyParams): Promise<CategoryFrequencyResponse[]> => {
  const limit = params?.limit ?? 10;
  const lang = params?.lang ?? 'en';

  const result = await pool.query(`
    SELECT 
        c.code AS category_id,
        COALESCE(t_lang.name, t_en.name, c.code::text) AS category_name, 
        COUNT(b.id) AS books_amount
    FROM public.dewey_classifications c
    INNER JOIN public.books b ON c.code = b.dewey_category_id
    LEFT JOIN public.dewey_classifications_translations t_lang 
        ON c.code = t_lang.dewey_classification_id AND t_lang.lang_code = $2
    LEFT JOIN public.dewey_classifications_translations t_en 
        ON c.code = t_en.dewey_classification_id AND t_en.lang_code = 'en'
    GROUP BY c.code, t_lang.name, t_en.name
    ORDER BY books_amount DESC
    LIMIT $1;
  `, [limit, lang]);

  return camelcaseKeys(result.rows);
};

export async function getDeweyClassifications(params: GetUDCListParams): Promise<DeweyClassificationDto[]> {
  const {
    lang = 'en',
    searchTerm,
    range,
    includeDiscontinued,
    includeUnassigned,
    page = 1,
    limit = 10,
  } = params;

  const allowedStatuses: DeweyStatus[] = ["in_use"];
  if (includeDiscontinued) allowedStatuses.push("discontinued");
  if (includeUnassigned) allowedStatuses.push("unassigned");

  const minCode = range?.min !== undefined && !isNaN(Number(range.min)) ? String(range.min).padStart(3, '0') : undefined;
  const maxCode = range?.max !== undefined && !isNaN(Number(range.max)) ? String(range.max).padStart(3, '0') : undefined;

  const whereClause: Prisma.dewey_classificationsWhereInput = {
    status: { in: allowedStatuses },
    ...(minCode || maxCode ? {
      code: {
        ...(minCode ? { gte: minCode } : {}),
        ...(maxCode ? { lte: maxCode } : {}),
      },
    } : {}),
  };

  if (searchTerm?.trim()) {
    const term = searchTerm.trim();
    whereClause.OR = [
      {
        code: {
          contains: term,
          mode: 'insensitive',
        },
      },
      {
        dewey_classifications_translations: {
          some: {
            lang_code: { in: [lang, 'en'] },
            name: {
              contains: term,
              mode: 'insensitive',
            },
          },
        },
      },
    ];
  }

  const parsedLimit = Math.max(1, Number(limit) || 10);
  const parsedPage = Math.max(1, Number(page) || 1);
  const offset = (parsedPage - 1) * parsedLimit;

  const items = await prisma.dewey_classifications.findMany({
    where: whereClause,
    orderBy: { code: 'asc' },
    skip: offset,
    take: parsedLimit,
    include: {
      dewey_classifications_translations: {
        where: {
          lang_code: { in: [lang, 'en'] },
        },
      },
    },
  });

  return items.map((item) => {
    const translationInLang = item.dewey_classifications_translations.find((t) => t.lang_code === lang);
    const translationInEn = item.dewey_classifications_translations.find((t) => t.lang_code === 'en');
    const name = translationInLang?.name || translationInEn?.name || 'Sin traducción';

    return {
      code: item.code,
      status: item.status as DeweyStatus,
      name,
    };
  });
}

export async function getDeweyClassificationsAmount(params: GetUDCAmountParams): Promise<number> {
  const {
    lang = 'es',
    searchTerm,
    range,
    includeDiscontinued,
    includeUnassigned,
  } = params;

  const allowedStatuses: DeweyStatus[] = ["in_use"];
  if (includeDiscontinued) allowedStatuses.push("discontinued");
  if (includeUnassigned) allowedStatuses.push("unassigned");

  const minCode = range?.min !== undefined && !isNaN(Number(range.min)) ? String(range.min).padStart(3, '0') : undefined;
  const maxCode = range?.max !== undefined && !isNaN(Number(range.max)) ? String(range.max).padStart(3, '0') : undefined;

  const whereClause: Prisma.dewey_classificationsWhereInput = {
    status: { in: allowedStatuses },
    ...(minCode || maxCode ? {
      code: {
        ...(minCode ? { gte: minCode } : {}),
        ...(maxCode ? { lte: maxCode } : {}),
      },
    } : {}),
  };

  if (searchTerm?.trim()) {
    const term = searchTerm.trim();
    whereClause.OR = [
      {
        code: {
          contains: term,
          mode: 'insensitive',
        },
      },
      {
        dewey_classifications_translations: {
          some: {
            lang_code: { in: [lang, 'en'] },
            name: {
              contains: term,
              mode: 'insensitive',
            },
          },
        },
      },
    ];
  }

  const amount = await prisma.dewey_classifications.count({ where: whereClause });
  return amount;
}

export const getBorrowedPercentage = async (): Promise<BorrowedMetrics> => {

  const copiesExists = !!(await prisma.book_copies.findFirst())

  if (!copiesExists) {
    return {
      totalCopies: 0,
      borrowedCopies: 0,
      availableCopies: 0,
      borrowedPercentage: 0
    };
  }

  const totalCopies = await prisma.book_copies.count()
  const borrowedCopies = await prisma.book_copies.count({
    where: {
      loans_copies: {
        some: {
          returned: false
        }
      }
    }
  })

  const availableCopies = totalCopies - borrowedCopies;
  const borrowedPercentage = (borrowedCopies / totalCopies) * 100;

  return {
    totalCopies,
    borrowedCopies,
    availableCopies,
    borrowedPercentage
  };
};