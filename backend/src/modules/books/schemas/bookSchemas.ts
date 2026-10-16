import { z } from "zod";

const titleSchema = z
    .string()
    .min(1, { message: "required" });

const isbnSchema = z
    .string()
    .min(1, { message: "required" });

const authorSchema = z
    .string()
    .min(1, { message: "required" }).optional();

const categoryIdSchema = z
    .string({ message: 'invalid_format' })
    .min(1, { message: "required" }).optional();

const udcIdSchema = z
    .string({ message: 'invalid_format' })
    .min(1, { message: "required" }).optional();

const editionDateSchema = z
    .string()
    .optional()

const tagsSchema = z
    .array(z.string())

const topographicSubjectSchema = z
    .string({ message: "invalid_format" })
    .min(1, { message: "required" })
    .optional()

const publisherSchema = z
    .string()
    .min(1, { message: "required" });

const descriptionSchema = z
    .string()
    .min(1, { message: "required" }).optional();

export const createBookSchema = z.object({
    title: titleSchema,
    author: authorSchema,
    isbn: isbnSchema,
    udcId: udcIdSchema,
    editionDate: editionDateSchema,
    tags: tagsSchema,
    publisher: publisherSchema,
    topographicSubject: topographicSubjectSchema,
    description: descriptionSchema
});

const inventoryNumberSchema = z
    .string()
    .min(1, { message: "required" });

export const createBookCopySchema = z.object({
    inventoryNumber: inventoryNumberSchema
});

export const updateBookCopySchema = z.object({
    inventoryNumber: inventoryNumberSchema
});