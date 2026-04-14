"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetryWorkerService = void 0;
const delivery_operations_service_1 = require("./delivery-operations.service");
const outbound_queue_service_1 = require("./outbound-queue.service");
class RetryWorkerService {
    timer = null;
    queue = new outbound_queue_service_1.OutboundQueueService();
    delivery = new delivery_operations_service_1.DeliveryOperationsService();
    running = false;
    start(intervalMs = 30_000) {
        if (this.timer)
            return;
        this.timer = setInterval(() => {
            this.tick().catch(() => { });
        }, intervalMs);
    }
    stop() {
        if (this.timer)
            clearInterval(this.timer);
        this.timer = null;
    }
    async tick() {
        if (this.running)
            return;
        this.running = true;
        try {
            const due = this.queue.listDueRetries(20);
            for (const item of due) {
                try {
                    await this.delivery.sendNow(item.id, 'RETRY_WORKER');
                }
                catch {
                    // keep worker resilient
                }
            }
        }
        finally {
            this.running = false;
        }
    }
}
exports.RetryWorkerService = RetryWorkerService;
