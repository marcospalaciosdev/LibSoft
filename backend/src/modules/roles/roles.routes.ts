import { Router } from "express";
import * as rolesController from "./roles.controller";

import { validateBody } from "../../utils/validateReqBody";
import { AddRoleSchema } from "./schemas/roles.schemas";

const router = Router();

router.get('/', rolesController.getRoles);
router.get('/count', rolesController.getRolesCount);
router.get('/public', rolesController.getPublicRoles);
router.get('/permissions', rolesController.getAllPermissions);
router.put('/permissions', rolesController.updatePermissionsMatrix);
router.post('/', validateBody(AddRoleSchema));

export default router;