import pool from '../../config/db';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getFaqsByLanguage = async (langCode: string, searchTerm?: string, limit: string = '10') => {
  const values: any[] = [langCode];

  let query = `
    SELECT 
      f.id,
      f.category,
      ft.question,
      ft.answer
    FROM faqs f
    INNER JOIN faq_translations ft ON f.id = ft.faq_id
    WHERE ft.language_code = $1
  `;

  if (searchTerm && searchTerm.trim() !== '' && searchTerm !== 'undefined') {
    values.push(`%${searchTerm}%`);
    query += ` AND (ft.question ILIKE $${values.length} OR ft.answer ILIKE $${values.length})`;
  }

  values.push(limit);
  query += ` LIMIT $${values.length}`;

  const result = await pool.query(query, values);
  return result.rows;
};

export const getFaqsByIds = async (ids: string[], langCode: string) => {

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  const cleanIds = ids
    .map(id => id.trim())
    .filter(id => uuidRegex.test(id));

  if (cleanIds.length === 0) return [];

  const values = [langCode, cleanIds];

  let query = `
    SELECT 
      f.id,
      f.category,
      ft.question,
      ft.answer
    FROM faqs f
    INNER JOIN faq_translations ft ON f.id = ft.faq_id
    WHERE ft.language_code = $1   -- 👈 Recibe langCode (values[0])
      AND f.id = ANY($2)          -- 👈 Recibe el array nativo cleanIds (values[1])
  `;

  const result = await pool.query(query, values);
  return result.rows;
};

export const getFaqsByCodes = async (codes: string[], langCode: string) => {

  const faqs = await prisma.faqs.findMany({
    where: {
      code: {
        in: codes
      }
    },
    include: {
      faq_translations: {
        where: {
          language_code: langCode
        },
        select: {
          question: true,
          answer: true
        }
      }
    }
  });

  return faqs.map(faq => {
    return {
      id: faq.id,
      category: faq.category,
      question: faq.faq_translations[0]?.question,
      answer: faq.faq_translations[0]?.answer
    }
  });

};