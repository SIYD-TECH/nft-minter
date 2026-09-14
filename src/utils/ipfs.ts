import { envConfig } from '../config/env';

/**
 * Resolves an IPFS URI or HTTP link to a browseable HTTP Gateway URL
 */
export function resolveIpfsUrl(url?: string): string {
  if (!url) return '/placeholder.png';

  // If already http/https, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // If data URI (e.g. data:image/svg+xml...)
  if (url.startsWith('data:')) {
    return url;
  }

  // Handle ipfs:// prefix
  if (url.startsWith('ipfs://')) {
    const cleanPath = url.replace('ipfs://', '');
    return `${envConfig.pinataGateway}${cleanPath}`;
  }

  // Handle bare CID (e.g. Qm... or bafy...)
  if (url.startsWith('Qm') || url.startsWith('bafy')) {
    return `${envConfig.pinataGateway}${url}`;
  }

  return url;
}

/**
 * Normalizes metadata JSON object
 */
export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  external_url?: string;
}
