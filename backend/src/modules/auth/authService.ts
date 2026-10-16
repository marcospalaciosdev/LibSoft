import pool from "../../config/db"
import bcrypt from "bcryptjs";

import { SALT_ROUNDS } from "../../config/config"
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createUser(params: {
    email: string,
    password: string,
    username: string,
    role_id: string,
    first_name: string,
    last_name: string,
    phone_number: string,
}) {

    const { email, password, username, role_id, first_name, last_name, phone_number } = params;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const result = await client.query(
            `INSERT INTO public.users 
            (email, username, password, first_name, last_name, phone_number, role_id, created_at)` +
            ` VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() AT TIME ZONE 'UTC')
                            RETURNING id, username, email, first_name, last_name, phone_number, role_id, created_at`,
            [email, username, hashedPassword, first_name, last_name, phone_number, role_id]
        );
        await client.query('COMMIT');
        return result.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

export async function authenticateUser(params: {
    identifier: string,
    passwordPlain: string,
}) {

    const query = `
        SELECT id, username, email, password, role_id 
        FROM public.users 
        WHERE username = $1 OR email = $1
    `;

    const result = await pool.query(query, [params.identifier]);


    if (result.rowCount === 0) return null;

    const user = result.rows[0];

    const match = await bcrypt.compare(params.passwordPlain, user.password);

    if (!match) return null;

    const { password: _, ...userFields } = user;
    return userFields;
}

export async function checkEmailAvailability(emailToCheck: string) {
    try {
        const userCount = await prisma.users.count({
            where: { email: emailToCheck },
        });

        return userCount > 0;
    } catch (error) {
        throw error;
    }
}

export async function requiresInitialSetup() {
    const initialSetupIsRequired = await prisma.users.count();
    return initialSetupIsRequired === 0;
}

export async function createInitialAdminUser(params: {
    email: string,
    password: string,
    username: string,
    first_name: string,
    last_name: string,
    phone_number: string,
}) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const usersCountResult = await client.query<{ count: string }>(
            'SELECT COUNT(*)::text AS count FROM public.users',
        );

        if (Number(usersCountResult.rows[0]?.count || 0) > 0) {
            throw new Error('INITIAL_SETUP_ALREADY_COMPLETED');
        }

        const adminRoleResult = await client.query<{ id: string }>(
            `SELECT id
             FROM public.roles
             WHERE LOWER(name) = 'administrator'
             LIMIT 1`,
        );

        if (adminRoleResult.rowCount === 0) {
            throw new Error('ADMIN_ROLE_NOT_FOUND');
        }

        const existingEmailResult = await client.query(
            'SELECT 1 FROM public.users WHERE email = $1 LIMIT 1',
            [params.email],
        );

        if ((existingEmailResult.rowCount ?? 0) > 0) {
            throw new Error('EMAIL_ALREADY_IN_USE');
        }

        const existingUsernameResult = await client.query(
            'SELECT 1 FROM public.users WHERE username = $1 LIMIT 1',
            [params.username],
        );

        if ((existingUsernameResult.rowCount ?? 0) > 0) {
            throw new Error('USERNAME_ALREADY_IN_USE');
        }

        const hashedPassword = await bcrypt.hash(params.password, SALT_ROUNDS);
        const createdUserResult = await client.query(
            `INSERT INTO public.users
                (email, username, password, first_name, last_name, phone_number, role_id, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() AT TIME ZONE 'UTC')
             RETURNING id, username, email, first_name, last_name, phone_number, role_id, created_at`,
            [
                params.email,
                params.username,
                hashedPassword,
                params.first_name,
                params.last_name,
                params.phone_number,
                adminRoleResult.rows[0].id,
            ],
        );

        await client.query('COMMIT');
        return createdUserResult.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

export type PermissionMap = Record<string, Record<string, boolean>>;

export const getPermissionsByRoleId = async (roleId: number): Promise<PermissionMap> => {
    const result = await pool.query(
        `SELECT
            COALESCE(jsonb_object_agg(module_name, module_permissions), '{}'::jsonb) AS permissions
         FROM (
            SELECT
                m.name AS module_name,
                jsonb_object_agg(p.name, true) AS module_permissions
            FROM roles_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            JOIN modules m ON p.module_id = m.id
            WHERE rp.role_id = $1
            GROUP BY m.name
         ) AS permissions_by_module`,
        [roleId]
    );

    return result.rows[0]?.permissions || {};
};