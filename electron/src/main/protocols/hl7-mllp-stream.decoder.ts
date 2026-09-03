const VT = '\x0b';
const FS = '\x1c';
const CR = '\r';

/**
 * Stateful MLLP decoder for TCP streams.
 * TCP chunk boundaries are not HL7 message boundaries, so this decoder buffers
 * partial frames and can emit multiple complete frames from a single chunk.
 */
export class Hl7MllpStreamDecoder {
    private buffer = '';

    push(chunk: string): string[] {
        if (!chunk) return [];
        this.buffer += chunk;

        const frames: string[] = [];
        while (this.buffer.length) {
            const start = this.buffer.indexOf(VT);
            if (start < 0) {
                // Preserve a short unframed tail in case the VT arrives in the next chunk.
                if (this.buffer.length > 64 * 1024) this.buffer = this.buffer.slice(-4096);
                break;
            }

            if (start > 0) this.buffer = this.buffer.slice(start);

            const end = this.buffer.indexOf(FS, 1);
            if (end < 0) break;

            const payload = this.buffer.slice(1, end);
            let consumed = end + 1;
            if (this.buffer[consumed] === CR) consumed += 1;
            this.buffer = this.buffer.slice(consumed);

            if (payload.trim()) frames.push(`${VT}${payload}${FS}${CR}`);
        }

        return frames;
    }

    pendingLength(): number {
        return this.buffer.length;
    }

    reset() {
        this.buffer = '';
    }
}
