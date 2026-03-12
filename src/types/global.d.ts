export { };

declare global {
    interface Window {
        appAPI: AppAPI;
        platform: {
            copyToClipboard: (text: string) => Promise<void>;

            labs: {
                list: () => Promise<any[]>;
                create: (dto: any) => Promise<any>;
                update: (id: string, dto: any) => Promise<any>;
                delete: (id: string) => Promise<void>;
            };
        };
    }
}