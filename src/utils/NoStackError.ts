export class NoStackError extends Error {
    public constructor(message?: string | undefined) {
        super(message);
        this.stack = this.message;
    }
}
