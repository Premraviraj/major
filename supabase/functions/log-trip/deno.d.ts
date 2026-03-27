// Type shim for Deno globals — editor IntelliSense only.
// Supabase Edge Functions run on Deno, which provides all of these natively.

declare namespace Deno {
  export const env: {
    get(key: string): string | undefined;
  };
}

declare class TextEncoder {
  encode(input?: string): Uint8Array;
}

declare class TextDecoder {
  decode(input?: ArrayBuffer | Uint8Array): string;
}

interface SubtleCrypto {
  digest(algorithm: string, data: ArrayBuffer | Uint8Array): Promise<ArrayBuffer>;
}

declare const crypto: { subtle: SubtleCrypto };

declare const console: {
  log(...args: unknown[]): void;
  error(...args: unknown[]): void;
  warn(...args: unknown[]): void;
};

declare class Response {
  constructor(body?: string | null, init?: { status?: number; headers?: Record<string, string> });
}

declare class Request {
  readonly method: string;
  json(): Promise<unknown>;
}
