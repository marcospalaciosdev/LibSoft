import { Request, Response } from 'express';
import * as authService from './authService';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import pool from '../../config/db';
import camelcaseKeys from 'camelcase-keys';

export async function regiterUser(req: Request, res: Response) {
    const { email, password, username, roleId, firstName, lastName, phoneNumber } = req.body;

    try {
        await authService.createUser({
            email: email,
            password: password,
            username: username,
            role_id: roleId,
            first_name: firstName,
            last_name: lastName,
            phone_number: phoneNumber
        });

        return res.status(201).json({ message: 'Usuario registrado correctamente' });
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).json({ message: 'Error al registrar usuario' });
    }
}

export async function getSetupStatus(_req: Request, res: Response) {
    try {
        const requiresSetup = await authService.requiresInitialSetup();
        return res.status(200).json({ requiresSetup });
    } catch (error) {
        console.error('Error al consultar el estado de configuración inicial:', error);
        return res.status(500).json({ message: 'Error al consultar la configuración inicial' });
    }
}

export async function setupInitialAdmin(req: Request, res: Response) {
    const { email, password, username, firstName, lastName, phoneNumber } = req.body;

    try {
        await authService.createInitialAdminUser({
            email,
            password,
            username,
            first_name: firstName,
            last_name: lastName,
            phone_number: phoneNumber,
        });

        return res.status(201).json({ message: 'Administrador inicial creado correctamente' });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === 'INITIAL_SETUP_ALREADY_COMPLETED') {
                return res.status(409).json({ message: 'La configuración inicial ya fue completada' });
            }

            if (error.message === 'ADMIN_ROLE_NOT_FOUND') {
                return res.status(500).json({ message: 'No se encontró el rol administrador base' });
            }

            if (error.message === 'EMAIL_ALREADY_IN_USE') {
                return res.status(409).json({ message: 'El correo electrónico ya está en uso' });
            }

            if (error.message === 'USERNAME_ALREADY_IN_USE') {
                return res.status(409).json({ message: 'El nombre de usuario ya está en uso' });
            }
        }

        console.error('Error al crear el administrador inicial:', error);
        return res.status(500).json({ message: 'No se pudo crear el administrador inicial' });
    }
}

export async function loginUser(req: Request, res: Response) {
    const { identifier, password } = req.body;

    try {
        const userLogged = await authService.authenticateUser({
            identifier: identifier,
            passwordPlain: password
        });

        if (!userLogged) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        await new Promise<void>((resolve, reject) => {
            req.session.regenerate((error) => {
                if (error) reject(error);
                else resolve();
            });
        });

        // Fetch full user data to return to the frontend
        const userResult = await pool.query(
            `SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.phone_number, u.role_id,
                    r.name as role_name
             FROM public.users u
             LEFT JOIN public.roles r ON u.role_id = r.id
             WHERE u.id = $1`,
            [userLogged.id]
        );

        const permissions = await authService.getPermissionsByRoleId(Number(userLogged.role_id));
        const user = { ...camelcaseKeys(userResult.rows[0], { deep: true }), permissions };
        (req.session as typeof req.session & { userId?: string }).userId = userLogged.id;

        console.log(permissions);

        return res.status(200).json({ user });

    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ message: 'Error al iniciar sesión' });
    }
}

export async function getMe(req: AuthenticatedRequest, res: Response) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'No autenticado' });
        }

        const userResult = await pool.query(
            `SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.phone_number, u.role_id,
                    r.name as role_name
             FROM public.users u
             LEFT JOIN public.roles r ON u.role_id = r.id
             WHERE u.id = $1`,
            [req.user.id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const permissions = await authService.getPermissionsByRoleId(Number(req.user.roleId));
        const user = { ...camelcaseKeys(userResult.rows[0], { deep: true }), permissions };
        return res.status(200).json(user);
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({ message: 'Error interno' });
    }
}

export function logoutUser(req: AuthenticatedRequest, res: Response) {
    req.session.destroy((error) => {
        if (error) {
            console.error('Error al destruir la sesión:', error);
            return res.status(500).json({ message: 'Error al cerrar sesión' });
        }

        res.clearCookie('connect.sid');
        return res.status(204).send();
    });
}

export async function checkEmailAvailability(req: Request, res: Response) {
    const { email } = req.body;

    try {
        const emailAvailable = await authService.checkEmailAvailability(email);

        if (emailAvailable) return res.status(200).json(true);
        return res.status(200).json(false);

    } catch (error) {
        console.error('Error al verificar email:', error);
        res.status(500).json({ message: 'Error interno' });
    }
}