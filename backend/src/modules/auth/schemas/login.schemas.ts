import { z } from "zod";

const identifierSchema = z
    .string()
    .trim()
    .min(1, { message: "required" });

const passwordSchema = z
    .string()
    .min(1, { message: "required" });

export const LoginSchema = z.object({
    identifier: identifierSchema,
    password: passwordSchema,
})

export type LoginFormValues = z.infer<typeof LoginSchema>;