import { z } from 'zod';
import {
    EmailSchema,
    PasswordSchema,
    UsernameSchema,
    FirstNameSchema,
    LastNameSchema,
    PhoneNumberSchema,
} from './register.schemas';

export const SetupAdminSchema = z.object({
    email: EmailSchema,
    password: PasswordSchema,
    username: UsernameSchema,
    firstName: FirstNameSchema,
    lastName: LastNameSchema,
    phoneNumber: PhoneNumberSchema,
});

export type SetupAdminFormValues = z.infer<typeof SetupAdminSchema>;
