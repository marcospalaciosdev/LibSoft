import https from "https";
import { URL } from "url";

export interface GeoRefSearchResult {
  cantidad: number;
  direcciones: Array<Record<string, unknown>>;
  inicio: number;
  parametros: Record<string, unknown>;
  total: number;
}

export const searchAddresses = (direccion: string, max = 10): Promise<GeoRefSearchResult> => {
  return new Promise((resolve, reject) => {
    const url = new URL('https://apis.datos.gob.ar/georef/api/direcciones');
    url.searchParams.set('direccion', direccion);
    url.searchParams.set('max', String(max));

    https.get(url.toString(), (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`GeoRef API error ${res.statusCode}: ${data}`));
          return;
        }

        try {
          const parsed = JSON.parse(data) as GeoRefSearchResult;
          resolve(parsed);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
};
