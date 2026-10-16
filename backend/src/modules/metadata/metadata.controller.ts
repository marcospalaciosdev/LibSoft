import { Request, Response } from "express";
import * as metadataService from "./metadata.service";
import camelcaseKeys from "camelcase-keys";

export async function getLibraryProfile(req: Request, res: Response) {
    try {
        const result = await metadataService.getLibraryProfile();

        if (!result) {
            return res.status(404).json({ message: 'Perfil de biblioteca no encontrado' });
        }
        return res.json(camelcaseKeys(result, { deep: true }));
    } catch (error) {
        return res.status(500).json({ error: error });
    }
}

export async function updateLibraryProfile(req: Request, res: Response) {
    try {
        const result = await metadataService.updateLibraryProfile(req.body);
        return res.json(result);
    } catch (error) {
        return res.status(500).json({ error: error });
    }
}