import { ZodError } from "zod";
import { snakeToCamel } from "./caseParser";

export const getFirstFieldsErrors = (error: ZodError): any => {
    const fieldErrors: any = {};

    error.issues.forEach(issue => {
        const path = issue.path.map(segment => typeof segment === "string" ? snakeToCamel(segment) : segment);

        if (path.length === 0) {
            if (!fieldErrors.root) fieldErrors.root = issue.message;
            return;
        }

        let current = fieldErrors;
        for (let i = 0; i < path.length; i++) {
            const key = path[i];
            const isLast = i === path.length - 1;

            if (isLast) {
                if (current[key] === undefined) {
                    current[key] = issue.message;
                }
            } else {
                const nextKey = path[i + 1];
                // Si aún no existe este nivel, o si es un string (error top-level previo), lo inicializamos
                if (current[key] === undefined || typeof current[key] === "string") {
                    current[key] = typeof nextKey === "number" ? [] : {};
                }
                current = current[key];
            }
        }
    });

    return fieldErrors;
};