import { Prisma, PrismaClient } from '@prisma/client';
import pool from '../../config/db';

import camelcaseKeys, { CamelCaseKeys } from 'camelcase-keys';

import {
  User,
  GetUsersParams,
  GetRolesParams,
  RoleResponseDto
} from '@LibSoft/shared-types';

const prisma = new PrismaClient();

export const getUsers = async (params?: GetUsersParams): Promise<User[]> => {
  const limit = Number(params?.limit) || 10;
  const offset = Number(params?.offset) || 0;

  const where: any = {};

  if (params?.search) {
    const search = params.search;
    where.OR = [
      { first_name: { contains: search, mode: 'insensitive' } },
      { last_name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { username: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (params?.role) {
    where.role_id = BigInt(params.role);
  }

  if (params?.status) {
    where.is_active = params.status === 'active';
  }

  const rows = await prisma.users.findMany({
    where,
    include: {
      role: {
        select: { id: true, name: true },
      },
    },
    orderBy: { id: 'asc' },
    skip: offset,
    take: limit,
  });

  return rows.map((u) => ({
    id: u.id,
    username: u.username,
    firstName: u.first_name,
    lastName: u.last_name,
    email: u.email ?? undefined,
    phoneNumber: u.phone_number,
    avatarUrl: u.avatar_url ?? undefined,
    isActive: u.is_active ?? true,
    createdAt: u.created_at?.toISOString() ?? undefined,
    role: {
      id: Number(u.role?.id ?? 0),
      name: u.role?.name ?? '',
    },
  })) as unknown as User[];
};

export const getCount = async (params?: GetUsersParams): Promise<number> => {
  const where: any = {};

  if (params?.search) {
    const search = params.search;
    where.OR = [
      { first_name: { contains: search, mode: 'insensitive' } },
      { last_name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { username: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (params?.role) {
    where.role_id = BigInt(params.role);
  }

  if (params?.status) {
    where.is_active = params.status === 'active';
  }

  return prisma.users.count({ where });
};

export const updateUser = async (id: string, data: Partial<User> & { roleId?: string | number }): Promise<User> => {
  const client = await pool.connect();

  console.log(data);

  try {
    const roleId = data.roleId ?? data.role?.id;

    const query = `
            UPDATE users
            SET
                first_name = COALESCE($1, first_name),
                last_name = COALESCE($2, last_name),
                username = COALESCE($3, username),
                email = COALESCE($4, email),
                phone_number = COALESCE($5, phone_number),
                role_id = COALESCE($6, role_id),
                address = COALESCE($7, address)
            WHERE id = $8
            RETURNING id
        `;
    const values = [
      data.firstName ?? null,
      data.lastName ?? null,
      data.username ?? null,
      data.email ?? null,
      data.phoneNumber ?? null,
      roleId ?? null,
      data.address ?? null,
      id,
    ];

    await client.query(query, values);
    return getUserById(id);
  } finally {
    client.release();
  }
};

export const getUserById = async (id: string): Promise<User> => {
  const client = await pool.connect();
  try {
    const query = `
            SELECT 
                users.id,
                users.username,
                users.first_name,
                users.last_name,
                users.email,
                users.address,
                users.dni,
                users.phone_number,
                users.is_active,
                users.created_at,
                roles.name as role,
                json_build_object(
					'id', roles.id,
					'name', roles.name
				) AS role
            FROM users
            JOIN roles
	            ON users.role_id = roles.id
            WHERE users.id = $1
        `;
    const values = [id];
    const result = await client.query(query, values);
    return camelcaseKeys(result.rows[0]);
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
};