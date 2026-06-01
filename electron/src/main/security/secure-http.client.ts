// // export class SecureHttpClient {
// //     private validateUrl(url: string, allowInsecureTls = false) {
// //         const parsed = new URL(url);
// //         const isLocalhost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';

// //         if (parsed.protocol !== 'https:' && !isLocalhost) {
// //             throw new Error('Only HTTPS endpoints are allowed outside localhost');
// //         }

// //         if (allowInsecureTls && process.env.NODE_ENV === 'production') {
// //             throw new Error('Insecure TLS is not allowed in production');
// //         }
// //     }

// //     async postJson(
// //         url: string,
// //         payload: any,
// //         headers: Record<string, string> = {},
// //         allowInsecureTls = false,
// //         requestTimeoutMs = 15_000,
// //     ) {
// //         this.validateUrl(url, allowInsecureTls);

// //         const controller = new AbortController();
// //         const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

// //         try {
// //             const res = await fetch(url, {
// //                 method: 'POST',
// //                 headers: {
// //                     'Content-Type': 'application/json',
// //                     ...headers,
// //                 },
// //                 body: JSON.stringify(payload),
// //                 signal: controller.signal,
// //             });

// //             const body = await res.text();

// //             return {
// //                 ok: res.ok,
// //                 status: res.status,
// //                 body,
// //             };
// //         } catch (e: any) {
// //             if (e?.name === 'AbortError') {
// //                 throw new Error(`Request timed out after ${requestTimeoutMs} ms`);
// //             }
// //             throw e;
// //         } finally {
// //             clearTimeout(timeout);
// //         }
// //     }
// // }


// // export class SecureHttpClient {
// //     private validateUrl(url: string, allowInsecureTls = false) {
// //         const parsed = new URL(url);
// //         const isLocalhost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';

// //         if (parsed.protocol !== 'https:' && !isLocalhost) {
// //             throw new Error('Only HTTPS endpoints are allowed outside localhost');
// //         }

// //         if (allowInsecureTls && process.env.NODE_ENV === 'production') {
// //             throw new Error('Insecure TLS is not allowed in production');
// //         }
// //     }

// //     async postJson(
// //         url: string,
// //         payload: any,
// //         headers: Record<string, string> = {},
// //         allowInsecureTls = false,
// //         requestTimeoutMs = 15_000,
// //     ) {
// //         this.validateUrl(url, allowInsecureTls);

// //         const controller = new AbortController();
// //         const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

// //         try {
// //             const res = await fetch(url, {
// //                 method: 'POST',
// //                 headers: {
// //                     'Content-Type': 'application/json',
// //                     ...headers,
// //                 },
// //                 body: JSON.stringify(payload),
// //                 signal: controller.signal,
// //             });

// //             const body = await res.text();

// //             return {
// //                 ok: res.ok,
// //                 status: res.status,
// //                 body,
// //             };
// //         } catch (e: any) {
// //             if (e?.name === 'AbortError') {
// //                 throw new Error(`Request timed out after ${requestTimeoutMs} ms`);
// //             }
// //             throw e;
// //         } finally {
// //             clearTimeout(timeout);
// //         }
// //     }

// //     async getJson<T = any>(
// //         url: string,
// //         headers: Record<string, string> = {},
// //         allowInsecureTls = false,
// //         requestTimeoutMs = 15_000,
// //     ): Promise<{ ok: boolean; status: number; body: string; json: T | null }> {
// //         this.validateUrl(url, allowInsecureTls);

// //         const controller = new AbortController();
// //         const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

// //         try {
// //             const res = await fetch(url, {
// //                 method: 'GET',
// //                 headers: {
// //                     Accept: 'application/json',
// //                     ...headers,
// //                 },
// //                 signal: controller.signal,
// //             });

// //             const body = await res.text();
// //             let json: T | null = null;

// //             if (body.trim()) {
// //                 try {
// //                     json = JSON.parse(body) as T;
// //                 } catch {
// //                     json = null;
// //                 }
// //             }

// //             return { ok: res.ok, status: res.status, body, json };
// //         } catch (e: any) {
// //             if (e?.name === 'AbortError') {
// //                 throw new Error(`Request timed out after ${requestTimeoutMs} ms`);
// //             }
// //             throw e;
// //         } finally {
// //             clearTimeout(timeout);
// //         }
// //     }

// // }


// // export class SecureHttpClient {
// //   private validateUrl(url: string, allowInsecureTls = false) {
// //     const parsed = new URL(url);
// //     const isLocalhost =
// //       parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";

// //     if (parsed.protocol !== "https:" && !isLocalhost) {
// //       throw new Error("Only HTTPS endpoints are allowed outside localhost");
// //     }

// //     if (allowInsecureTls && process.env.NODE_ENV === "production") {
// //       throw new Error("Insecure TLS is not allowed in production");
// //     }
// //   }

// //   async getJson(
// //     url: string,
// //     headers: Record<string, string> = {},
// //     allowInsecureTls = false,
// //     requestTimeoutMs = 15_000,
// //   ) {
// //     this.validateUrl(url, allowInsecureTls);

// //     const controller = new AbortController();
// //     const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

// //     try {
// //       const res = await fetch(url, {
// //         method: "GET",
// //         headers: {
// //           Accept: "application/json",
// //           ...headers,
// //         },
// //         signal: controller.signal,
// //       });

// //       const body = await res.text();

// //       return {
// //         ok: res.ok,
// //         status: res.status,
// //         body,
// //       };
// //     } catch (e: any) {
// //       if (e?.name === "AbortError") {
// //         throw new Error(`Request timed out after ${requestTimeoutMs} ms`);
// //       }
// //       throw e;
// //     } finally {
// //       clearTimeout(timeout);
// //     }
// //   }

// //   async postJson(
// //     url: string,
// //     payload: any,
// //     headers: Record<string, string> = {},
// //     allowInsecureTls = false,
// //     requestTimeoutMs = 15_000,
// //   ) {
// //     this.validateUrl(url, allowInsecureTls);

// //     const controller = new AbortController();
// //     const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

// //     try {
// //       const res = await fetch(url, {
// //         method: "POST",
// //         headers: {
// //           "Content-Type": "application/json",
// //           ...headers,
// //         },
// //         body: JSON.stringify(payload),
// //         signal: controller.signal,
// //       });

// //       const body = await res.text();

// //       return {
// //         ok: res.ok,
// //         status: res.status,
// //         body,
// //       };
// //     } catch (e: any) {
// //       if (e?.name === "AbortError") {
// //         throw new Error(`Request timed out after ${requestTimeoutMs} ms`);
// //       }
// //       throw e;
// //     } finally {
// //       clearTimeout(timeout);
// //     }
// //   }
// // }


// // export class SecureHttpClient {
// //     private validateUrl(url: string, allowInsecureTls = false) {
// //         const parsed = new URL(url);
// //         const isLocalhost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';

// //         if (parsed.protocol !== 'https:' && !isLocalhost) {
// //             throw new Error('Only HTTPS endpoints are allowed outside localhost');
// //         }

// //         if (allowInsecureTls && process.env.NODE_ENV === 'production') {
// //             throw new Error('Insecure TLS is not allowed in production');
// //         }
// //     }

// //     async getJson(
// //         url: string,
// //         headers: Record<string, string> = {},
// //         allowInsecureTls = false,
// //         requestTimeoutMs = 15_000,
// //     ): Promise<any> {
// //         this.validateUrl(url, allowInsecureTls);

// //         const controller = new AbortController();
// //         const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

// //         try {
// //             const res = await fetch(url, {
// //                 method: 'GET',
// //                 headers,
// //                 signal: controller.signal,
// //             });

// //             const body = await res.text();
// //             if (!res.ok) {
// //                 throw new Error(`HTTP ${res.status}: ${body || 'No response body'}`);
// //             }

// //             try {
// //                 return JSON.parse(body || '{}');
// //             } catch (error: any) {
// //                 throw new Error(`Failed to parse JSON response from ${url}: ${error?.message ?? error}`);
// //             }
// //         } catch (e: any) {
// //             if (e?.name === 'AbortError') {
// //                 throw new Error(`Request timed out after ${requestTimeoutMs} ms`);
// //             }
// //             throw e;
// //         } finally {
// //             clearTimeout(timeout);
// //         }
// //     }

// //     async postJson(
// //         url: string,
// //         payload: any,
// //         headers: Record<string, string> = {},
// //         allowInsecureTls = false,
// //         requestTimeoutMs = 15_000,
// //     ) {
// //         this.validateUrl(url, allowInsecureTls);

// //         const controller = new AbortController();
// //         const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

// //         try {
// //             const res = await fetch(url, {
// //                 method: 'POST',
// //                 headers: {
// //                     'Content-Type': 'application/json',
// //                     ...headers,
// //                 },
// //                 body: JSON.stringify(payload),
// //                 signal: controller.signal,
// //             });

// //             const body = await res.text();

// //             return {
// //                 ok: res.ok,
// //                 status: res.status,
// //                 body,
// //             };
// //         } catch (e: any) {
// //             if (e?.name === 'AbortError') {
// //                 throw new Error(`Request timed out after ${requestTimeoutMs} ms`);
// //             }
// //             throw e;
// //         } finally {
// //             clearTimeout(timeout);
// //         }
// //     }
// // }


// export class SecureHttpClient {
//     private validateUrl(url: string, allowInsecureTls = false) {
//         const parsed = new URL(url);
//         const isLocalhost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';

//         if (parsed.protocol !== 'https:' && !isLocalhost) {
//             throw new Error('Only HTTPS endpoints are allowed outside localhost');
//         }

//         if (allowInsecureTls && process.env.NODE_ENV === 'production') {
//             throw new Error('Insecure TLS is not allowed in production');
//         }
//     }

//     async postJson(
//         url: string,
//         payload: any,
//         headers: Record<string, string> = {},
//         allowInsecureTls = false,
//         requestTimeoutMs = 15_000,
//     ) {
//         this.validateUrl(url, allowInsecureTls);

//         const controller = new AbortController();
//         const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

//         try {
//             const res = await fetch(url, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     ...headers,
//                 },
//                 body: JSON.stringify(payload),
//                 signal: controller.signal,
//             });

//             const body = await res.text();

//             return {
//                 ok: res.ok,
//                 status: res.status,
//                 body,
//             };
//         } catch (e: any) {
//             if (e?.name === 'AbortError') {
//                 throw new Error(`Request timed out after ${requestTimeoutMs} ms`);
//             }
//             throw e;
//         } finally {
//             clearTimeout(timeout);
//         }
//     }
//     async getJson(
//         url: string,
//         headers: Record<string, string> = {},
//         allowInsecureTls = false,
//         requestTimeoutMs = 15_000,
//     ) {
//         this.validateUrl(url, allowInsecureTls);

//         const controller = new AbortController();
//         const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

//         try {
//             const res = await fetch(url, {
//                 method: 'GET',
//                 headers: {
//                     Accept: 'application/json',
//                     ...headers,
//                 },
//                 signal: controller.signal,
//             });

//             const body = await res.text();
//             let json: any = null;
//             if (body && body.trim()) {
//                 try {
//                     json = JSON.parse(body);
//                 } catch {
//                     json = null;
//                 }
//             }

//             return {
//                 ok: res.ok,
//                 status: res.status,
//                 body,
//                 json,
//             };
//         } catch (e: any) {
//             if (e?.name === 'AbortError') {
//                 throw new Error(`Request timed out after ${requestTimeoutMs} ms`);
//             }
//             throw e;
//         } finally {
//             clearTimeout(timeout);
//         }
//     }

// }


export class SecureHttpClient {
    private validateUrl(url: string, allowInsecureTls = false) {
        const parsed = new URL(url);
        const hostname = parsed.hostname.toLowerCase();
        const isLocalhost =
            hostname === 'localhost' ||
            hostname === '127.0.0.1' ||
            hostname === '0.0.0.0' ||
            hostname === '::1' ||
            hostname.endsWith('.localhost');

        if (parsed.protocol !== 'https:' && !isLocalhost && !allowInsecureTls) {
            throw new Error('Only HTTPS endpoints are allowed outside localhost');
        }

        if (allowInsecureTls && process.env.NODE_ENV === 'production') {
            throw new Error('Insecure TLS is not allowed in production');
        }
    }


    async getJson<T = any>(
        url: string,
        headers: Record<string, string> = {},
        allowInsecureTls = false,
        requestTimeoutMs = 15_000,
    ): Promise<{ ok: boolean; status: number; body: string; json?: T | null }> {
        this.validateUrl(url, allowInsecureTls);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

        try {
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    ...headers,
                },
                signal: controller.signal,
            });

            const body = await res.text();
            let json: T | null = null;

            if (body && body.trim()) {
                try {
                    json = JSON.parse(body) as T;
                } catch {
                    json = null;
                }
            }

            return {
                ok: res.ok,
                status: res.status,
                body,
                json,
            };
        } catch (e: any) {
            if (e?.name === 'AbortError') {
                throw new Error(`Request timed out after ${requestTimeoutMs} ms`);
            }
            throw e;
        } finally {
            clearTimeout(timeout);
        }
    }

    async postJson(
        url: string,
        payload: any,
        headers: Record<string, string> = {},
        allowInsecureTls = false,
        requestTimeoutMs = 15_000,
    ) {
        this.validateUrl(url, allowInsecureTls);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...headers,
                },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });

            const body = await res.text();

            return {
                ok: res.ok,
                status: res.status,
                body,
            };
        } catch (e: any) {
            if (e?.name === 'AbortError') {
                throw new Error(`Request timed out after ${requestTimeoutMs} ms`);
            }
            throw e;
        } finally {
            clearTimeout(timeout);
        }
    }
}
