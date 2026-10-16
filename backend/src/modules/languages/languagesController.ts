import * as languagesService from "./languagesService";
import { Request, Response } from "express";

export async function getAvailableLanguages(req: Request, res: Response) {
    try {
        const result = await languagesService.getAvailableLanguages();
        return res.status(200).json(result);
    } catch (e) {
        console.log("[getAvailableLanguages] error", e);
        return res.status(400).json({
            success: false,
            error: "Error fetching available languages"
        });
    }
}