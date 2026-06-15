// export type DeliverySendArgs = {
//     target: DeliveryTarget;
//     queueItem: DeliveryQueueItem;
//     headers: Record<string, string>;
//     allowInsecureTls?: boolean;
// };

// export type DeliverySendResult = {
//     status: number;
//     body?: string | null;
// };

// export type DeliveryTargetType = 'DHIS2' | 'OPENMRS' | 'LIS' | 'CUSTOM_HTTP';

// export interface DeliveryAdapter {
//     send(args: {
//         target: DeliveryTarget;
//         queueItem: DeliveryQueueItem;
//         headers: Record<string, string>;
//         allowInsecureTls?: boolean;
//     }): Promise<{ status: number; body?: string | null }>;
// }

// export type DeliveryTarget = {
//     id: string;
//     type: 'DHIS2' | 'OPENMRS' | 'LIS' | 'CUSTOM_HTTP';
//     name: string;
//     base_url: string;
//     enabled: number;
//     request_timeout_ms?: number | null;
// };

// export type DeliveryQueueItem = {
//     id: string;
//     target_id: string;
//     payload_json: string;
//     delivery_status: 'PENDING' | 'SENDING' | 'DELIVERED' | 'FAILED';
//     retry_count: number;
//     next_retry_at?: string | null;
//     last_error?: string | null;
// };

// export interface DeliveryAdapter {
//     send(args: {
//         target: DeliveryTarget;
//         queueItem: DeliveryQueueItem;
//         headers: Record<string, string>;
//         allowInsecureTls?: boolean;
//         requestTimeoutMs?: number | null;
//     }): Promise<{ status: number; body?: string | null }>;
// }

// export interface DeliveryAdapter {
//     send(args: {
//         target: DeliveryTarget;
//         queueItem: DeliveryQueueItem;
//         headers: Record<string, string>;
//         allowInsecureTls?: boolean;
//     }): Promise<{ status: number; body?: string | null }>;
// }

export type DeliveryTargetType = 'DHIS2' | 'OPENMRS' | 'LIS' | 'CUSTOM_HTTP';

export type DeliveryTarget = {
    id: string;
    type: DeliveryTargetType;
    name: string;
    base_url: string;
    enabled: number;
    request_timeout_ms?: number | null;
};

export type DeliveryQueueItem = {
    id: string;
    target_id: string;
    payload_json: string;
    delivery_status: 'PENDING' | 'SENDING' | 'DELIVERED' | 'FAILED';
    retry_count: number;
    next_retry_at?: string | null;
    last_error?: string | null;
};

export type DeliverySendArgs = {
    target: DeliveryTarget;
    queueItem: DeliveryQueueItem;
    headers: Record<string, string>;
    allowInsecureTls?: boolean;
    requestTimeoutMs?: number | null;
};

export type DeliverySendResult = {
    status: number;
    body?: string | null;
    diagnostics?: string[];
};

export interface DeliveryAdapter {
    send(args: DeliverySendArgs): Promise<DeliverySendResult>;
}
