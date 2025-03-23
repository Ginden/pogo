import pg from "pg";

export class Db extends pg.Client {
    async [Symbol.asyncDispose]() {
        await this.end();
    }
}
