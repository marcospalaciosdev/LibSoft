import { Router } from "express";
import * as rolesController from "../roles/roles.controller";

const router = Router();

router.get('/roles', rolesController.getPublicRoles);

export default router;