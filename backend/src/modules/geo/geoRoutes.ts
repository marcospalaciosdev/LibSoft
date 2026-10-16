import { Router } from 'express';
import * as GeoController from './geoController';

const router = Router();

router.get('/direcciones', GeoController.searchAddresses);

export default router;
