import { ROLES_CONSTANTS } from "@LibSoft/shared-constants";
import { z } from "zod";

export const RoleSlugSchema = z
    .string()
    .min(1, { message: "required" })
    .min(ROLES_CONSTANTS.SLUG.MINIMUM_LENGTH, { message: "too_short" })
    .max(ROLES_CONSTANTS.SLUG.MAXIMUM_LENGTH, { message: "too_long" })
    .regex(/^[a-z0-9_]+$/, { message: "invalid_characters" });

export const RoleNameSchema = z
    .string()
    .min(1, { message: "required" })
    .min(ROLES_CONSTANTS.NAME.MINIMUM_LENGTH, { message: "too_short" })
    .max(ROLES_CONSTANTS.NAME.MAXIMUM_LENGTH, { message: "too_long" })
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s_-]+$/, { message: "invalid_characters" });

export const RoleDescriptionSchema = z
    .string()
    .max(ROLES_CONSTANTS.DESCRIPTION.MAXIMUM_LENGTH, { message: "too_long" });

export const LanguageCodeSchema = z
    .string()
    .min(1, { message: "required" })
    .length(2, { message: "invalid_language_code" });

export const RoleColorRgbSchema = z
    .string()
    .min(1, { message: "required" })
    .regex(/^(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})$/, { message: "invalid_rgb_format" })
    .refine((val) => {
        const parts = val.split(",").map((n) => parseInt(n.trim(), 10));
        return parts.every((num) => num >= 0 && num <= 255);
    }, { message: "rgb_value_out_of_range" });

export const RoleTranslationItemSchema = z.object({
    languageCode: LanguageCodeSchema,
    name: RoleNameSchema,
    description: RoleDescriptionSchema,
});

export const AddRoleSchema = z.object({
    slug: RoleSlugSchema,
    translations: z
        .array(RoleTranslationItemSchema)
        .min(1, { message: "at_least_one_translation_required" }),
    colorRGB: RoleColorRgbSchema,
});