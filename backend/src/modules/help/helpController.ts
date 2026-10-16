import { Request, Response } from 'express';
import * as HelpService from './helpService';

export const getFaqsByLanguage = async (req: Request, res: Response) => {

    try {
        const lang = String(req.params.lang);
        const searchTerm = req.query.searchTerm ? String(req.query.searchTerm).trim() : '';
        const { limit } = req.query;

        const cleanLimit = limit ? String(limit).trim() : '10';

        const faqs = await HelpService.getFaqsByLanguage(lang, searchTerm, cleanLimit);
        res.status(200).json(faqs);
    } catch (error: any) {
        console.error('Error al obtener los faqs:', error);
        res.status(500).json({
            error: 'Fallo al obtener la lista de faqs',
            details: error.message
        });
    }
}

export const getFaqsByIds = async (req: Request, res: Response) => {

    try {
        const { lang } = req.params;
        const { ids } = req.query;

        if (!ids) return res.status(200).json([]);

        const idsArray = String(ids).split(',');

        const faqs = await HelpService.getFaqsByIds(idsArray, String(lang));
        res.status(200).json(faqs);
    } catch (error: any) {
        console.error('Error al obtener los faqs:', error);
        res.status(500).json({
            error: 'Fallo al obtener la lista de faqs',
            details: error.message
        });
    }
}

export const getFaqsByCodes = async (req: Request, res: Response) => {

    try {
        const { lang } = req.params;
        const { codes } = req.query;

        if (!codes) return res.status(200).json([]);

        const codesArray = String(codes).split(',');

        const faqs = await HelpService.getFaqsByCodes(codesArray, String(lang));
        res.status(200).json(faqs);
    } catch (error: any) {
        console.error('Error al obtener los faqs:', error);
        res.status(500).json({
            error: 'Fallo al obtener la lista de faqs',
            details: error.message
        });
    }
}