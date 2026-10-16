import { Request, Response } from "express";
import * as rolesService from "./roles.service";
import {
    GetRolesParams,
    RoleResponseDto
} from "@LibSoft/shared-types";

const parseBooleanValue = (value: unknown): boolean | undefined => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    return undefined;
};

export const getRoles = async (
    req: Request,
    res: Response,
): Promise<Response<RoleResponseDto[] | { message: string }>> => {

    try {
        const { lang, users, usersLimit, includeAdmin, includePermissions } = req.query;

        const params: GetRolesParams = {
            lang: lang as string | undefined,
            users: parseBooleanValue(users),
            usersLimit: usersLimit ? parseInt(usersLimit as string, 10) : undefined,
            includeAdmin: parseBooleanValue(includeAdmin),
            includePermissions: parseBooleanValue(includePermissions),
        };

        const data = await rolesService.getRoles(params);
        return res.json(data);
    } catch (error: any) {
        return res.status(500).json({ message: error?.message ?? error });
    }
}

export const getPublicRoles = async (
    req: Request,
    res: Response
): Promise<Response<RoleResponseDto[] | { message: string }>> => {
    try {
        const data = await rolesService.getRoles({
            lang: req.query.lang as string,
            users: false,
            includeAdmin: false,
            includePermissions: false,
        });
        return res.json(data);
    } catch (error: any) {
        return res.status(500).json({ message: error?.message ?? error });
    }
}

export const getRolesCount = async (
    req: Request,
    res: Response
): Promise<Response<number | { message: string }>> => {
    try {
        const data = await rolesService.getRolesCount();
        return res.json(data);
    } catch (error: any) {
        return res.status(500).json({ message: error?.message ?? error });
    }
}

export const getAllPermissions = async (
    req: Request,
    res: Response
): Promise<Response> => {
    try {
        const data = await rolesService.getAllPermissions();
        return res.json(data);
    } catch (error: any) {
        return res.status(500).json({ message: error?.message ?? error });
    }
}

export const updatePermissionsMatrix = async (
    req: Request,
    res: Response
): Promise<Response> => {
    try {
        console.log(" --- UPDATE PERMISSIONS MATRIX REQUEST BODY ---");
        console.log(req.body);
        const matrix = req.body?.matrix ?? req.body;
        const data = await rolesService.updatePermissionsMatrix(matrix);
        return res.json({ message: "Permissions matrix updated successfully", ...data });
    } catch (error: any) {
        return res.status(500).json({ message: error?.message ?? error });
    }
}

export const addRole = async (
    req: Request,
    res: Response
): Promise<Response<RoleResponseDto | { message: string }>> => {
    try {
        console.log(" --- ADD ROLE REQUEST BODY ---");
        console.log(req.body);
        const data = await rolesService.addRole(req.body);
        return res.json({ message: "Role added successfully", ...data });
    } catch (error: any) {
        return res.status(500).json({ message: error?.message ?? error });
    }
}
