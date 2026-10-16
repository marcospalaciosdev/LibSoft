import { Router } from "express";
import * as usersController from "./users.controller";
import * as rolesController from '../roles/roles.controller'
import { validateBody } from '../../utils/validateReqBody';

import { UpdateSchema } from "../auth/schemas/register.schemas";

const router = Router();

router.get('/', usersController.getUsers);
router.get('/count', usersController.getCount);
router.get('/:id', usersController.getUserById);
router.put('/:id', validateBody(UpdateSchema), usersController.updateUser);

export default router;