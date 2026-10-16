import { Prisma, PrismaClient } from '@prisma/client';

import {
  GetRolesParams,
  RoleResponseDto,
  PermissionItem,
  AddRoleDto
} from '@LibSoft/shared-types';

const prisma = new PrismaClient();

export const getRolesCount = async (): Promise<number> => {
  const count = await prisma.roles.count();
  return count;
};

export const getRoles = async (params?: GetRolesParams): Promise<RoleResponseDto[]> => {

  const fetchUsers = params?.users;
  const limit = params?.usersLimit ?? 5;
  const includeAdmin = params?.includeAdmin;
  const includePermissions = params?.includePermissions;
  const lang = params?.lang ?? 'en';

  try {
    const whereCondition: Prisma.rolesWhereInput = {};

    if (!includeAdmin) {
      whereCondition.AND = [
        { id: { not: 1 } },
        { name: { not: { equals: 'administrator' } } }
      ];
    }

    const roles = await prisma.roles.findMany({
      where: whereCondition,
      orderBy: { id: 'asc' },
      select: {
        id: true,
        name: true,
        type: true,
        color_rgb: true,
        roles_names: {
          where: { lng_id: lang },
          select: { name: true },
        },
        roles_descriptions: {
          where: { lng_id: lang },
          select: { description: true },
        },
        ...(fetchUsers ? {
          users: {
            where: { is_active: true },
            orderBy: { created_at: 'desc' },
            take: limit,
            select: {
              id: true,
              first_name: true,
              last_name: true,
              username: true,
              avatar_url: true,
            },
          },
        } : {}),
        ...(includePermissions ? {
          roles_permissions: {
            select: {
              permissions: {
                select: {
                  id: true,
                  name: true,
                  modules: {
                    select: { id: true, name: true },
                  },
                },
              },
            },
          },
        } : {}),
      },
    });

    const result: RoleResponseDto[] = roles.map((role: any) => ({
      id: Number(role.id),
      name: role.roles_names?.[0]?.name ?? role.name,
      slug: role.name,
      description: role.roles_descriptions?.[0]?.description ?? undefined,
      type: role.type ?? undefined,
      colorRGB: role.color_rgb ?? undefined,
      usersPreview: fetchUsers
        ? (role.users ?? []).map((u: any) => ({
          id: u.id,
          fullName: `${u.first_name} ${u.last_name}`,
          username: u.username,
          avatarUrl: u.avatar_url,
        }))
        : [],
      permissions: includePermissions
        ? (role.roles_permissions ?? []).map((rp: any) => ({
          permissionId: Number(rp.permissions.id),
          moduleId: Number(rp.permissions.modules.id),
          module: rp.permissions.modules.name,
          actionId: Number(rp.permissions.id),
          action: rp.permissions.name,
        }))
        : [],
    }));

    return result;

  } catch (error) {
    throw error;
  }
};

export const getAllPermissions = async (): Promise<PermissionItem[]> => {
  const permissions = await prisma.permissions.findMany({
    orderBy: [{ module_id: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      name: true,
      modules: {
        select: { id: true, name: true },
      },
    },
  });

  return permissions.map((p) => ({
    permissionId: Number(p.id),
    moduleId: Number(p.modules.id),
    module: p.modules.name,
    actionId: Number(p.id),
    action: p.name,
  }));
};

export const updatePermissionsMatrix = async (
  matrix: Record<string, Record<string, boolean>>
): Promise<{ updated: number }> => {
  const roleIds = Object.keys(matrix ?? {});

  if (roleIds.length === 0) {
    return { updated: 0 };
  }

  const operations = roleIds.flatMap((roleIdStr) => {
    const roleId = BigInt(roleIdStr);
    const permissionsMap = matrix[roleIdStr] ?? {};

    const permissionIdsToEnable = Object.entries(permissionsMap)
      .filter(([, isActive]) => !!isActive)
      .map(([permissionIdStr]) => BigInt(permissionIdStr));

    const permissionIdsToDisable = Object.entries(permissionsMap)
      .filter(([, isActive]) => !isActive)
      .map(([permissionIdStr]) => BigInt(permissionIdStr));

    const ops: Prisma.PrismaPromise<any>[] = [];

    if (permissionIdsToDisable.length > 0) {
      ops.push(
        prisma.roles_permissions.deleteMany({
          where: {
            role_id: roleId,
            permission_id: { in: permissionIdsToDisable },
          },
        })
      );
    }

    if (permissionIdsToEnable.length > 0) {
      ops.push(
        prisma.roles_permissions.createMany({
          data: permissionIdsToEnable.map((permissionId) => ({
            role_id: roleId,
            permission_id: permissionId,
          })),
          skipDuplicates: true,
        })
      );
    }

    return ops;
  });

  if (operations.length === 0) {
    return { updated: 0 };
  }

  await prisma.$transaction(operations);

  return { updated: roleIds.length };
};

export const addRole = async (data: AddRoleDto) => {
  try {
    const role = await prisma.roles.create({
      data: {
        name: data.slug,
        type: "custom",
        color_rgb: data.colorRGB,
      },
    });

    let names;
    let descriptions;

    if (data.translations && data.translations.length > 0) {
      names = await prisma.roles_names.createMany({
        data: data.translations.map(t => ({
          role_id: role.id,
          lng_id: t.languageCode,
          name: t.name,
        })),
      });

      descriptions = await prisma.roles_descriptions.createMany({
        data: data.translations.map(t => ({
          role_id: role.id,
          lng_id: t.languageCode,
          description: t.description,
        })),
      });
    }

    return {
      ...role,
      translations: names,
      descriptions: descriptions,
    };
  } catch (error) {
    throw error;
  }
}