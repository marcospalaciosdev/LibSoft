import { z } from "zod";

const libraryNameSchema = z
    .string()
    .min(1, { message: "required" });

const libraryAddressSchema = z
    .string()
    .min(1, { message: "required" });

const libraryPhoneSchema = z
    .string()
    .min(1, { message: "required" });

const libraryEmailSchema = z
    .string()
    .min(1, { message: "required" })
    .email({ message: "invalid_email" });

export const LibraryProfileSchema = z.object({
    libraryName: libraryNameSchema,
    primaryEmail: libraryEmailSchema,
    phoneNumber: libraryPhoneSchema,
    address: libraryAddressSchema,
});

export type LibraryProfileFormValues = z.infer<typeof LibraryProfileSchema>;