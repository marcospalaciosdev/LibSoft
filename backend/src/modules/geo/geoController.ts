import { Request, Response } from 'express';
import * as GeoService from './geoService';

export const searchAddresses = async (req: Request, res: Response) => {
  try {
    const direccion = req.query.direccion;
    const max = req.query.max ? Number(req.query.max) : 10;

    if (!direccion || typeof direccion !== 'string') {
      return res.status(400).json({ error: 'El query param direccion es obligatorio' });
    }

    const result = await GeoService.searchAddresses(direccion, max);
    res.status(200).json(result);
  } catch (error: any) {
    console.error('Error GeoRef search:', error);
    res.status(500).json({
      error: 'Fallo al buscar direcciones',
      details: error?.message || String(error),
    });
  }
};
