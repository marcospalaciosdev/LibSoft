import camelcaseKeys from "camelcase-keys";
import pool from "../../config/db"

import { auditApi } from "../audit/audit.api";

export async function getLibraryProfile() {

    const query = `
        SELECT 
            id,
            library_name,
            primary_email,
            phone_number,
            address,
            TO_CHAR(updated_at, 'YYYY-MM-DD HH24:MI:SS') AS updated_at 
        FROM library_profile
    `;
    const result = await pool.query(query);

    return result.rows[0];
}

export async function updateLibraryProfile(data: any) {

    const oldLibraryProfile = await getLibraryProfile();

    console.log(data);

    const query = `
        UPDATE library_profile
        SET
            library_name = $1,
            primary_email = $2,
            phone_number = $3,
            address = $4,
            updated_at = NOW() AT TIME ZONE 'UTC' 
        WHERE id = 1 RETURNING 
            id,
            library_name,
            primary_email,
            phone_number,
            address,
            TO_CHAR(updated_at, 'YYYY-MM-DD HH24:MI:SS') AS updated_at 
        ;
    `;

    const result = await pool.query(query, [data.libraryName, data.primaryEmail, data.phoneNumber, data.address]);

    auditApi.log({
        action: 'UPDATE',
        module: 'library_profile',
        entityId: result.rows[0].id,
        oldValues: oldLibraryProfile,
        newValues: result.rows[0],
    });

    return result.rows[0];
}