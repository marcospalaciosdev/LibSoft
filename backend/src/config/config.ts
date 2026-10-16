import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({
    path: path.resolve(__dirname, '../../.env'),
});

export const SALT_ROUNDS = process.env.JWT_SALT_ROUNDS ? parseInt(process.env.JWT_SALT_ROUNDS) : 10;

if (!SALT_ROUNDS) throw new Error('JWT_SALT_ROUNDS no está definido en backend/.env');

const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) throw new Error('SESSION_SECRET no está definido en backend/.env');

export const SESSION_SECRET = sessionSecret;

export const APP_CONSTANTS = {
    PASSWORD: {
        MINIMUM_LENGTH: 12,
        MAXIMUM_LENGTH: 100,
    },
    USERNAME: {
        MINIMUM_LENGTH: 5,
        MAXIMUM_LENGTH: 20,
    },

    NAME: {
        MAXIMUM_LENGTH: 50,
    },

    PHONE: {
        MAXIMUM_LENGTH: 15,
    },

    EMAIL: {
        MAXIMUM_LENGTH: 100,
    },

    ADDRESS: {
        MAXIMUM_LENGTH: 100,
    },
}
