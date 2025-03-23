import {Db} from "./db-wrapper.js";

export const getDb = async () => {
    const client = new Db({
        host: 'localhost',
        port: 25432,
        user: 'pogo',
        password: 'pogo',
    });
    await client.connect();

    return client;
}
