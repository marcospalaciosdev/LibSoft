import { httpClient } from '@/shared/services/http';

export interface GeoRefSearchResult {
  cantidad: number;
  direcciones: Array<Record<string, unknown>>;
  inicio: number;
  parametros: Record<string, unknown>;
  total: number;
}

export const geoApi = {
  searchAddresses: (direccion: string, max = 10) =>
    httpClient.get<GeoRefSearchResult>('/geo/direcciones', {
      params: { direccion, max: String(max) },
    }),
};
