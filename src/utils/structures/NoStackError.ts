export class NoStackError extends Error {
    public constructor(message?: string) {
        super(message);
        this.stack = this.message;
        this.name = "NoStackError";
    }
}
