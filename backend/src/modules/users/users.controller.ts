import { Request, Response } from "express";
import * as usersService from "./users.service";
import {
    User,
    GetUsersParams,
    GetRolesParams,
    RoleResponseDto
} from "@LibSoft/shared-types";

import { NextFunction } from "express";

export const getUsers = async (
    req: Request,
    res: Response
): Promise<Response<User[] | { message: string }>> => {
    try {
        const params: GetUsersParams = {
            search: req.query.search as string,
            role: req.query.role as string,
            status: req.query.status as string,
            limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
            offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined
        };

        console.log(" --- GET USERS PARAMS  ---");
        console.log(params);

        const data: User[] = await usersService.getUsers(params);
        return res.json(data);
    } catch (error: any) {
        return res.status(500).json({ message: error });
    }
}

export const getCount = async (
    req: Request,
    res: Response
): Promise<Response<number | { message: string }>> => {
    try {
        const params: GetUsersParams = {
            search: req.query.search as string,
            role: req.query.role as string,
            status: req.query.status as string,
        };
        const data: number = await usersService.getCount(params);
        return res.json(data);
    } catch (error: any) {
        return res.status(401).json({ message: error });
    }
}

export const getUserById = async (
    req: Request,
    res: Response
): Promise<Response<User | { message: string }>> => {
    try {
        const { id } = req.params;
        const data = await usersService.getUserById(id as string);
        return res.json(data);
    } catch (error: any) {
        return res.status(401).json({ message: error });
    }
}

export const updateUser = async (
    req: Request,
    res: Response
): Promise<Response<User | { message: string }>> => {
    try {
        const { id } = req.params;
        console.log(" --- UPDATE USER REQUEST BODY ---");
        console.log(req.body);
        const data = await usersService.updateUser(id as string, req.body);
        return res.json(data);
    } catch (error: any) {
        return res.status(500).json({ message: error?.message ?? error });
    }
}