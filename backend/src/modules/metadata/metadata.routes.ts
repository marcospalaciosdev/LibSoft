import { Router } from "express";
import * as metadataController from "./metadata.controller";
import { validateBody } from "../../utils/validateReqBody";
import { LibraryProfileSchema } from "./schemas/metadata.schemas";

const router = Router();

router.get('/library-profile', metadataController.getLibraryProfile);
router.patch('/library-profile', validateBody(LibraryProfileSchema), metadataController.updateLibraryProfile);

export default router;