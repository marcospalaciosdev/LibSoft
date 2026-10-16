import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { SectionHeader } from "@/shared/components/layout/SectionHeader";
import { languagesApi } from "@/features/languages/api/languages.api";
import { Button, DropDownMenu, Input } from "@/shared/components/ui";
import type { AddRoleDto } from "@LibSoft/shared-types";
import { rolesApi } from "../api/roles.api";
import { hexToRgbString } from "@/shared/utils";
import { firstCap } from "@/shared/utils/firstCap";
import { useOutsideClick } from "@/shared/hooks/useOutsideClick";

interface Language {
    code: string;
    name: string;
}

interface RoleTranslation {
    id: string;
    languageCode: string;
    languageName: string;
    name: string;
    description: string;
}

export function AddRolePage() {
    const { t } = useTranslation();

    const [slug, setSlug] = useState<string>("");
    const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
    const [roleTranslations, setRoleTranslations] = useState<RoleTranslation[]>([]);
    const [roleColor, setRoleColor] = useState<string>("#ff0000");
    const [loading, setLoading] = useState<boolean>(true);

    const [errors, setErrors] = useState<any>({});
    const submitBtnRef = useRef<HTMLButtonElement>(null);

    useOutsideClick([submitBtnRef], () => setErrors({}));

    useEffect(() => {
        const fetchLanguages = async () => {
            try {
                const data = await languagesApi.getAvailableLanguages();
                setAvailableLanguages(data || []);
            } catch (error) {
                console.error("Error al obtener los idiomas:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLanguages();
    }, []);

    const hasMoreLanguagesToAdd = availableLanguages.some(
        (lang) => !roleTranslations.some((rt) => rt.languageCode === lang.code)
    );

    const handleAddLanguage = () => {
        const unselectedLanguages = availableLanguages.filter(
            (lang) => !roleTranslations.some((rt) => rt.languageCode === lang.code)
        );

        if (unselectedLanguages.length === 0) return;

        const nextLanguage = unselectedLanguages[0];

        setRoleTranslations((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                languageCode: nextLanguage.code,
                languageName: nextLanguage.name,
                name: "",
                description: "",
            },
        ]);
    };

    const handleSelectLanguage = (id: string, selectedCode: string) => {
        const selectedLang = availableLanguages.find((l) => l.code === selectedCode);
        if (!selectedLang) return;

        setRoleTranslations((prev) =>
            prev.map((item) =>
                item.id === id
                    ? { ...item, languageCode: selectedLang.code, languageName: selectedLang.name }
                    : item
            )
        );
    };

    const handleTranslationChange = (
        id: string,
        field: "name" | "description",
        value: string
    ) => {
        setRoleTranslations((prev) =>
            prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
        );
    };

    const handleRemoveLanguage = (id: string) => {
        setRoleTranslations((prev) => prev.filter((item) => item.id !== id));
    };

    const handleSubmit = async () => {
        try {
            const payload: AddRoleDto = {
                slug: slug || (roleTranslations[0]?.name ? roleTranslations[0].name.toLowerCase().replace(/\s+/g, "_") : ""),
                translations: roleTranslations.map((translation) => ({
                    name: translation.name,
                    languageCode: translation.languageCode,
                    description: translation.description,
                })),
                colorRGB: hexToRgbString(roleColor),
            };

            console.log(payload);

            await rolesApi.addRole(payload);
        } catch (e: any) {
            setErrors(e.data.errors);
            console.error("Error al guardar el rol:", e);
        }
    };

    useEffect(() => console.log(errors), [errors]);

    const getDropdownOptionsForId = (currentId: string) => {
        return availableLanguages
            .filter((lang) => {
                const isSelectedElsewhere = roleTranslations.some(
                    (rt) => rt.id !== currentId && rt.languageCode === lang.code
                );
                return !isSelectedElsewhere;
            })
            .map((lang) => ({
                label: lang.name,
                value: lang.code,
            }));
    };

    return (
        <div className="p-8 overflow-y-auto h-full">
            <SectionHeader
                title={t('roles.addPage.title')}
                description={t('roles.addPage.subtitle')}
                icon="add_box"
            />
            <main className="mt-6">
                <div className="flex flex-col gap-6">
                    <section className="w-full flex flex-col border-t border-[rgb(var(--color-border))] pt-6 gap-4">
                        <h3 className="text-lg font-medium text-[rgb(var(--color-text))]">
                            Información General
                        </h3>
                        <div className="w-full">
                            <div className="flex flex-col w-1/2 mb-6">
                                <Input
                                    label={t('roles.addPage.inputs.slug.label')}
                                    placeholder={t('roles.addPage.inputs.slug.placeholder')}
                                    inputClassName="rounded-md text-sm mb-2"
                                    height="50px"
                                    value={slug}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSlug(e.target.value)}
                                    error={errors.slug ? firstCap(t(`roles.addPage.inputs.slug.errors.${errors.slug}`)) : ''}
                                />
                            </div>
                            <div>
                                <label htmlFor="add-role-color" className="cursor-pointer text-sm font-medium text-[rgb(var(--color-text-muted))] whitespace-nowrap overflow-hidden text-ellipsis min-w-0">
                                    Color del Rol
                                </label>
                                <Button
                                    style={{
                                        background: roleColor,
                                    }}
                                    className={`relative rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-white h-12 w-12 mt-2 ring-3 ring-white`}
                                >
                                    <input
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            const hexColor = e.target.value;
                                            setRoleColor(hexColor);
                                        }}

                                        value={roleColor}
                                        type="color"
                                        className='absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 rounded-full'
                                    />
                                </Button>
                            </div>
                        </div>
                    </section>

                    <section className="w-full flex flex-col border-t border-[rgb(var(--color-border))] pt-6 gap-4">
                        <h3 className="text-lg font-m
                        edium text-[rgb(var(--color-text))]">
                            {t('roles.addPage.nameTranslations')}
                        </h3>

                        {roleTranslations.map((translation, index) => (
                            <div
                                key={translation.id}
                                className="flex flex-row items-center gap-4 bg-[rgb(var(--color-bg-secondary))] rounded-md"
                            >
                                <div className="flex flex-col gap-4 flex-1">
                                    <div className="flex flex-row w-full gap-4">
                                        <div className="w-48">
                                            <DropDownMenu
                                                height="40px"
                                                className="h-fit"
                                                color="rgb(var(--color-text))"
                                                fontSize="(length:--fs-body-sm)"
                                                options={getDropdownOptionsForId(translation.id)}
                                                onSelect={(option) => handleSelectLanguage(translation.id, option)}
                                            >
                                                {translation.languageName || "Seleccionar idioma"}
                                            </DropDownMenu>
                                        </div>

                                        <div className="flex-1">
                                            <Input
                                                className="h-full"
                                                inputClassName="rounded-md text-(length:--fs-body-sm) mb-1"
                                                placeholder={`Nombre del rol en ${translation.languageName}`}
                                                value={translation.name}
                                                error={errors.translations?.[index]?.name ? firstCap(t(`roles.addPage.inputs.translation.name.errors.${errors.translations[index].name}`)) : undefined}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                    handleTranslationChange(translation.id, "name", e.target.value)
                                                }
                                            />
                                        </div>
                                    </div>

                                    <Input
                                        type="textarea"
                                        value={translation.description}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                            handleTranslationChange(translation.id, "description", e.target.value)
                                        }
                                        error={errors.translations?.[index]?.description ? firstCap(t(`roles.addPage.inputs.translation.description.errors.${errors.translations[index].description}`)) : undefined}
                                        inputClassName="rounded-md text-(length:--fs-body-sm)"
                                        placeholder={`Descripción del rol en ${translation.languageName}`}
                                    />
                                </div>

                                <Button
                                    variant="danger"
                                    type="button"
                                    onClick={() => handleRemoveLanguage(translation.id)}
                                    className="rounded-md h-fit aspect-square text-(length:--fs-icon-md) p-2!"
                                >
                                    <span className="material-symbols-outlined">delete</span>
                                </Button>
                            </div>
                        ))}

                        <div className="py-2 w-full flex flex-col">
                            {errors.translations && errors.translations === 'at_least_one_translation_required' && (
                                <span className="text-(length:--fs-body-sm) mb-2 text-red-500">
                                    {firstCap(t(`roles.addPage.inputs.translation.errors.atLeastOneTranslationRequired`))}
                                </span>
                            )}

                            {hasMoreLanguagesToAdd ? (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={handleAddLanguage}
                                    disabled={loading}
                                    className="border-2 w-fit rounded-none border-dashed border-[rgb(var(--color-primary-500))]"
                                    leftIcon={
                                        <span className="text-(length:--fs-icon-md) material-symbols-outlined">
                                            add
                                        </span>
                                    }
                                >
                                    {loading ? "Cargando..." : "Add Language"}
                                </Button>
                            ) : (
                                <span className="text-(length:--fs-body-sm) text-[rgb(var(--color-text-muted))]">
                                    Se han agregado traducciones para todos los idiomas disponibles.
                                </span>
                            )}
                        </div>
                    </section>

                    <div className="flex justify-end gap-4 border-t border-[rgb(var(--color-border))] pt-4">
                        <Button
                            onClick={handleSubmit}
                            ref={submitBtnRef}
                            className="rounded-md"
                        >
                            Guardar Rol
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}