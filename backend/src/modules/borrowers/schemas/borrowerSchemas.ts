import { z } from "zod";

import { APP_CONSTANTS } from "../../../config/config";

const NameSchema = z
    .string()
    .min(1, { message: 'required' })
    .max(APP_CONSTANTS.NAME.MAXIMUM_LENGTH, { message: 'too_long' });

const EmailSchema = z
    .string()
    .email({ message: 'invalid_format' })
    .max(APP_CONSTANTS.EMAIL.MAXIMUM_LENGTH, { message: 'too_long' });

const PhoneSchema = z
    .string()
    .min(1, { message: 'required' })
    .max(APP_CONSTANTS.PHONE.MAXIMUM_LENGTH, { message: 'too_long' });

const AddressSchema = z
    .string({ message: 'invalid_format' })
    .max(APP_CONSTANTS.ADDRESS.MAXIMUM_LENGTH, { message: 'too_long' });

const StatusSchema = z
    .enum(['enabled', 'disabled'], { message: 'invalid' });

const DisableReasonSchema = z
    .string()
    .max(100, { message: 'too_long' });

const DniSchema = z
    .string({ message: 'invalid' })
    .length(8, { message: 'required' });

const GenderSchema = z
    .enum(['male', 'female', 'other']);

export const UpdateBorrowerSchema = z.object({
    firstName: NameSchema,
    lastName: NameSchema,
    email: EmailSchema,
    phone: PhoneSchema,
    address: AddressSchema,
    status: StatusSchema,
    disableReason: DisableReasonSchema,
    dni: DniSchema,
});

export const CreateBorrowerSchema = z.object({
    firstName: NameSchema,
    lastName: NameSchema,
    email: EmailSchema,
    phone: PhoneSchema,
    address: AddressSchema,
    dni: DniSchema,
    gender: GenderSchema,
});

export type UpdateBorrowerMiddleware = z.infer<typeof UpdateBorrowerSchema>;
export type CreateBorrowerMiddleware = z.infer<typeof CreateBorrowerSchema>;