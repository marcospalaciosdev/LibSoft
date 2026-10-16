export function camelToSnakeString(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

export function snakeToCamel(str: string): string {
    return str.replace(/([-_][a-z])/g, group =>
        group.toUpperCase().replace('-', '').replace('_', '')
    );
}

export const camelToSnakeObject = (obj: any): any => {

    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) return obj.map(item => camelToSnakeObject(item));

    const newObj: Record<string, any> = {};

    Object.keys(obj).forEach((key) => {
        const snakeKey = camelToSnakeString(key);
        newObj[snakeKey] = camelToSnakeObject(obj[key]);
    });

    return newObj;
};