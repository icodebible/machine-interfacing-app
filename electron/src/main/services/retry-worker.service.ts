import { DeliveryOperationsService } from './delivery-operations.service';
import { OutboundQueueService } from './outbound-queue.service';

export class RetryWorkerService {
    private timer: NodeJS.Timeout | null = null;
    private queue = new OutboundQueueService();
    private delivery = new DeliveryOperationsService();
    private running = false;

    start(intervalMs = 30_000) {
        if (this.timer) return;

        this.timer = setInterval(() => {
            this.tick().catch(() => { });
        }, intervalMs);
    }

    stop() {
        if (this.timer) clearInterval(this.timer);
        this.timer = null;
    }

    private async tick() {
        if (this.running) return;
        this.running = true;

        try {
            const due = this.queue.listDueRetries(20) as any[];
            for (const item of due) {
                try {
                    await this.delivery.sendNow(item.id, 'RETRY_WORKER');
                } catch {
                    // keep worker resilient
                }
            }
        } finally {
            this.running = false;
        }
    }
}
