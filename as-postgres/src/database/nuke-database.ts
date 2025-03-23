import type {Client} from "pg";

export async function nukeDatabase(db: Client) {
    const queriesToGetPublicTablesAndViews = `
        SELECT 
            'DROP ' || (
                CASE WHEN table_type = 'VIEW' THEN 'VIEW'
                WHEN table_type = 'BASE TABLE' THEN 'TABLE'
                END
                ) || ' ' || quote_ident(table_schema) || '.' || quote_ident(table_name) || ' CASCADE' as "sql",
            table_schema, table_name, table_type
        FROM information_schema.tables
        WHERE table_schema = 'public'
    `;

    const result = await db.query(queriesToGetPublicTablesAndViews);


    for (const {sql} of result.rows) {
        console.log(`Running ${sql}`);
        await db.query(sql);
    }
}
