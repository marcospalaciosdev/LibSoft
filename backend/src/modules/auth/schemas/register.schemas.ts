import { z } from "zod";
import { APP_CONSTANTS } from "../../../config/config";

export const EmailSchema = z
    .string()
    .trim()
    .toLowerCase()
    .min(1, { message: "required" })
    .email({ message: "invalid_format" });

export const PasswordSchema = z
    .string()
    .min(1, { message: "required" })
    .min(APP_CONSTANTS.PASSWORD.MINIMUM_LENGTH, { message: "too_short" })
    .max(APP_CONSTANTS.PASSWORD.MAXIMUM_LENGTH, { message: "too_long" })
    .regex(/[A-Z]/, { message: "missing_uppercase" })
    .regex(/[0-9]/, { message: "missing_number" })
    .regex(/[^a-zA-Z0-9]/, { message: "missing_special_char" });

export const UsernameSchema = z
    .string()
    .min(1, { message: "required" })
    .min(APP_CONSTANTS.USERNAME.MINIMUM_LENGTH, { message: "too_short" })
    .max(APP_CONSTANTS.USERNAME.MAXIMUM_LENGTH, { message: "too_long" })
    .regex(/^[a-zA-Z0-9_]+$/, { message: "invalid_characters" });

export const FirstNameSchema = z
    .string()
    .min(1, { message: "required" })
    .max(APP_CONSTANTS.NAME.MAXIMUM_LENGTH, { message: "too_long" })
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/, { message: "only_letters" });

export const LastNameSchema = z
    .string()
    .min(1, { message: "required" })
    .max(APP_CONSTANTS.NAME.MAXIMUM_LENGTH, { message: "too_long" })
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/, { message: "only_letters" });

export const PhoneNumberSchema = z
    .string()
    .min(1, { message: "required" })
    .min(8, { message: "too_short" })
    .max(15, { message: "too_long" })

export const RoleIdSchema = z
    .coerce.number({ error: "invalid_type" })
    .min(1, { message: "required" });

export const AddressSchema = z
    .string()
    .min(1, { message: "required" });

export const RegisterSchema = z.object({
    email: EmailSchema,
    password: PasswordSchema,
    username: UsernameSchema,
    firstName: FirstNameSchema,
    lastName: LastNameSchema,
    phoneNumber: PhoneNumberSchema,
    roleId: RoleIdSchema,
});


export const UpdateSchema = z.object({
    firstName: FirstNameSchema,
    lastName: LastNameSchema,
    phoneNumber: PhoneNumberSchema.optional(),
    roleId: RoleIdSchema,
    username: UsernameSchema,
    email: EmailSchema.optional(),
    address: AddressSchema.optional(),
});

export type RegisterFormValues = z.infer<typeof RegisterSchema>;
export type UpdateFormValues = z.infer<typeof UpdateSchema>;