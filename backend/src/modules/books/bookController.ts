import { Request, Response } from 'express';
import * as BookService from './bookService';
import { BookDTO, BookDetail, CategoryFrequencyResponse, EditBookDTO } from '@LibSoft/shared-types';
import camelcaseKeys from 'camelcase-keys';

export const getAmount = async (req: Request, res: Response) => {
    try {
        const amount = await BookService.getAmount();
        res.status(200).json(amount);
    } catch (error: any) {
        console.error('Error al obtener la cantidad de libros:', error);
        res.status(500).json({ error: 'Fallo al obtener la cantidad de libros' });
    }
};

export const createBook = async (req: Request, res: Response) => {

    try {
        const bookData = req.body;

        const newBook = await BookService.insertBook(bookData);
        res.status(201).json(newBook);
    } catch (error: any) {
        console.error('Error al crear el libro:', error);
        if (error.code === 'DUPLICATE_TOPOGRAPHIC_SUBJECT') {
            return res.status(409).json({ message: error.message });
        }
        res.status(500).json({ error: 'Fallo al meter el libro a la base de datos', details: error.message });
    }
};

export const updateBook = async (
    req: Request<{ id: string }>,
    res: Response<BookDetail | BookDTO | { error: string, details?: string }>
) => {
    try {
        const { id } = req.params;

        console.log(" --- bookController.ts --- ");
        console.log("Updating book with ID: ", id);
        console.log("New book data: ", req.body);

        const updatedBook = await BookService.updateBook(String(id), req.body as EditBookDTO);

        console.log("Updated Book: ", updatedBook);

        if (!updatedBook) {
            return res.status(404).json({ error: 'Libro no encontrado' });
        }
        res.status(200).json(updatedBook);
    } catch (error: any) {
        console.error('Error al actualizar el libro:', error);
        if (error.code === 'DUPLICATE_TOPOGRAPHIC_SUBJECT') {
            return res.status(409).json({ error: error.message });
        }
        res.status(500).json({ error: 'Fallo al actualizar el libro', details: error.message });
    }
};

export const createCopy = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const copyData = { ...req.body, book_id: id };

        const newCopy = await BookService.insertCopy(copyData);
        res.status(201).json(newCopy);
    } catch (error: any) {
        console.error('Error al crear la copia:', error);
        res.status(500).json({ error: 'Fallo al meter la copia a la base de datos', details: error.message });
    }
};

export const updateCopy = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { inventoryNumber } = req.body;

        const updatedCopy = await BookService.updateCopy(String(id), String(inventoryNumber));
        if (!updatedCopy) {
            return res.status(404).json({ error: 'Copia no encontrada' });
        }
        res.status(200).json(updatedCopy);
    } catch (error: any) {
        console.error('Error al actualizar la copia:', error);
        res.status(500).json({ error: error.message || 'Fallo al actualizar la copia' });
    }
};

export const deleteCopy = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        console.log(id);
        const deletedCopy = await BookService.deleteCopy(String(id));
        res.status(200).json({ message: 'Copia eliminada correctamente', deletedCopy });
    } catch (error: any) {
        console.error('Error al eliminar la copia:', error);
        res.status(500).json({ error: 'Fallo al eliminar la copia' });
    }
};

export const deleteCopiesBulk = async (req: Request, res: Response) => {
    try {
        const idsRaw = req.query.ids;

        const copyIds: string[] = typeof idsRaw === 'string'
            ? idsRaw.split(',')
            : [];

        await BookService.deleteCopiesBulk(copyIds);
        return res.status(200).json({ message: 'Copias eliminadas correctamente' });
    } catch (error) {
        return res.status(500).json({ message: 'Error al eliminar las copias', error });
    }
};

export const getBookCopies = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { onlyAvailable, searchTerm, limit, page } = req.query;

        let cleanSearchTerm = searchTerm as string | undefined;
        if (
            cleanSearchTerm === 'undefined' ||
            cleanSearchTerm === 'null' ||
            !cleanSearchTerm?.trim()
        ) {
            cleanSearchTerm = undefined;
        }

        const params = {
            onlyAvailable: onlyAvailable === 'true',
            searchTerm: cleanSearchTerm,
            limit: limit ? parseInt(limit as string, 10) : undefined,
            page: page ? parseInt(page as string, 10) : undefined
        };

        const copies = await BookService.getCopiesByBookId(String(id), params);

        res.status(200).json(copies);
    } catch (error: any) {
        console.error('Error al obtener las copias del libro:', error);
        res.status(500).json({ error: 'Fallo al obtener las copias del libro' });
    }
};

export const getCopyDetails = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const details = await BookService.getCopyDetails(String(id));

        if (!details) return res.status(404).json({ error: 'Copia no encontrada' });

        res.status(200).json(camelcaseKeys(details, { deep: true }));
    } catch (error: any) {
        console.error('Error al obtener los detalles de la copia:', error);
        res.status(500).json({ error: 'Fallo al obtener los detalles de la copia' });
    }
};

export const getBookUnitsAmount = async (req: Request, res: Response) => {

    try {
        const { id } = req.params;
        const amount = await BookService.getBookUnitsAmount(String(id));
        res.status(200).json(amount);
    } catch (error: any) {
        console.error('Error al obtener la cantidad de copias del libro:', error);
        res.status(500).json({ error: 'Fallo al obtener la cantidad de copias del libro' });
    }
};

export const getAllBooks = async (req: Request, res: Response) => {
    try {
        const { title, isbn, categoryId, limit, offset, sortBy, order, lang } = req.query;
        const params = {
            title: title as string | undefined,
            isbn: isbn as string | undefined,
            categoryId: categoryId ? parseInt(categoryId as string, 10) : undefined,
            limit: limit ? parseInt(limit as string, 10) : undefined,
            offset: offset ? parseInt(offset as string, 10) : undefined,
            sortBy: sortBy as string | undefined,
            order: order as string | undefined,
            lang: lang as string | undefined
        };

        const books = await BookService.getBooks(params);
        res.status(200).json(books);
    } catch (error: any) {
        console.error('Error al obtener libros:', error);
        res.status(500).json({ error: 'Fallo al obtener la lista de libros' });
    }
};

export const getBookById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { lang } = req.query;

        console.log(" --- bookController.ts ---");
        console.log("ID: ", id);
        console.log("Lang: ", lang);

        const book = await BookService.getBookById(String(id), String(lang));

        if (!book) return res.status(404).json({ error: 'Libro no encontrado' });

        res.status(200).json(book);
    } catch (error: any) {
        console.error('Error al obtener el libro por ID:', error);
        res.status(500).json({ error: 'Fallo al obtener el librardo' });
    }
};

export const getCategories = async (req: Request, res: Response) => {
    try {
        const categories = await BookService.getCategories();
        res.status(200).json(categories);
    } catch (error: any) {
        console.error('Error al obtener las categorías:', error);
        res.status(500).json({ error: 'Fallo al obtener las categorías' });
    }
};

export const getCategoriesFrecuency = async (
    req: Request,
    res: Response<CategoryFrequencyResponse[] | { message: string }>
) => {
    try {
        const { limit, lang } = req.query;
        const params = {
            limit: limit ? parseInt(String(limit), 10) : 10,
            lang: lang as string,
        };
        const categoriesFrecuency = await BookService.getCategoriesFrecuency(params);
        res.status(200).json(categoriesFrecuency);
    } catch (error: any) {
        console.error('Error al obtener la frecuencia de las categorías:', error);
        res.status(500).json({ message: 'Fallo al obtener la frecuencia de las categorías' });
    }
};

export const getBorrowedPercentage = async (req: Request, res: Response) => {
    try {
        const metrics = await BookService.getBorrowedPercentage();
        res.json(metrics);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

export const deleteBook = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await BookService.deleteBook(id as string);
        res.status(204).send();
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}


export async function getDeweyClassifications(req: Request, res: Response) {

    try {
        const lang = (req.query.lang as string) || 'es';
        const searchTerm = (req.query.searchTerm as string) || ''
        const min = (req.query.min as string) ? parseInt(req.query.min as string, 10) : undefined;
        const max = (req.query.max as string) ? parseInt(req.query.max as string, 10) : undefined;
        const includeDiscontinued = req.query.includeDiscontinued === 'true';
        const includeUnassigned = req.query.includeUnassigned === 'true';
        const page = (req.query.page as string) ? parseInt(req.query.page as string, 10) : 1;
        const limit = (req.query.limit as string) ? parseInt(req.query.limit as string, 10) : 10;

        const params = {
            lang: lang,
            searchTerm: searchTerm,
            range: { min, max },
            includeDiscontinued: includeDiscontinued,
            includeUnassigned: includeUnassigned,
            page: page,
            limit: limit
        };

        const result = await BookService.getDeweyClassifications(params);
        return res.json(result);
    } catch (error: any) {
        return res.status(500).json({ error: error?.message || error });
    }
}

export async function getDeweyClassificationsAmount(req: Request, res: Response) {
    try {
        const lang = (req.query.lang as string) || 'es';
        const min = (req.query.min as string) ? parseInt(req.query.min as string, 10) : undefined;
        const max = (req.query.max as string) ? parseInt(req.query.max as string, 10) : undefined;
        const searchTerm = (req.query.searchTerm as string) || '';
        const includeDiscontinued = req.query.includeDiscontinued === 'true';
        const includeUnassigned = req.query.includeUnassigned === 'true';

        const amount = await BookService.getDeweyClassificationsAmount({
            searchTerm: searchTerm,
            includeDiscontinued: includeDiscontinued,
            includeUnassigned: includeUnassigned,
        });
        res.status(200).json(amount);
    } catch (error: any) {
        res.status(500).json({ error: error?.message || error });
    }
}

export async function checkCopyAvailability(req: Request, res: Response) {
    try {
        const { inventoryNumber } = req.query;
        const available = await BookService.checkCopyAvailability(inventoryNumber as string);
        res.status(200).json(available);
    } catch (error: any) {
        res.status(500).json({ error: error?.message || error });
    }
}