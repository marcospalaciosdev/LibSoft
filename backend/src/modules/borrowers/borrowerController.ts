import { Request, Response } from "express";
import * as BorrowerService from "./borrowerService";
import camelcaseKeys from "camelcase-keys";

export const getBorrowerById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const borrower = await BorrowerService.getBorrowerById(String(id));
        res.status(200).json(camelcaseKeys(borrower, { deep: true }));
    } catch (error: any) {
        res.status(500).json({
            error: 'Fallo al obtener el socio',
            details: error.message
        });
    }
}

export const getAllBorrowers = async (req: Request, res: Response) => {
    try {
        const {
            name,
            surname,
            dni,
            limit,
            offset,
            sortBy,
            order,
            status
        } = req.query;
        const params = {
            name: (name && name !== 'undefined') ? name as string : undefined,
            surname: (surname && surname !== 'undefined') ? surname as string : undefined,
            dni: (dni && dni !== 'undefined') ? dni as string : undefined,
            limit: limit ? parseInt(limit as string, 10) : undefined,
            offset: offset ? parseInt(offset as string, 10) : undefined,
            sortBy: (sortBy && sortBy !== 'undefined') ? sortBy as string : undefined,
            order: (order && order !== 'undefined') ? order as string : undefined,
            status: (status && status !== 'undefined') ? status as "all" | "enabled" | "disabled" | "withDebt" : "all"
        };

        console.log("--- GET ALL BORROWERS ---");
        console.log(params);

        const borrowers = await BorrowerService.getBorrowers(params);
        res.status(200).json(camelcaseKeys(borrowers, { deep: true }));
    } catch (error: any) {
        console.error('Error al obtener los borrowers:', error);
        res.status(500).json({
            error: 'Fallo al obtener la lista de borrowers',
            details: error.message
        });
    }
}

export const getBorrowersAmount = async (req: Request, res: Response) => {
    try {
        const amount = await BorrowerService.getBorrowersAmount();
        res.status(200).json(camelcaseKeys(amount, { deep: true }));
    } catch (error: any) {
        console.error('Error al obtener la cantidad de borrowers:', error);
        res.status(500).json({
            error: 'Fallo al obtener la cantidad de borrowers',
            details: error.message
        });
    }
}

export const updateBorrower = async (req: Request, res: Response) => {

    try {
        const { id } = req.params;
        const updatedBorrower = await BorrowerService.updateBorrower(String(id), req.body);
        res.status(200).json(camelcaseKeys(updatedBorrower, { deep: true }));
    } catch (error: any) {
        console.error('Error al actualizar el socio:', error);
        res.status(500).json({
            error: 'Fallo al actualizar el socio',
            details: error.message
        });
    }
}

export const createBorrower = async (req: Request, res: Response) => {
    try {
        const createdBorrower = await BorrowerService.createBorrower(req.body);
        res.status(200).json(camelcaseKeys(createdBorrower, { deep: true }));
    } catch (error: any) {
        console.error('Error al crear el socio:', error);
        res.status(500).json({
            error: 'Fallo al crear el socio',
            details: error.message
        });
    }
}