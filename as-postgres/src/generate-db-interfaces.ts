import ts from 'typescript';
import pg from "pg";

const outputPath = 'src/databases/interfaces.ts';

const sourceFile = ts.createSourceFile(
    outputPath,
    '',
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TS
);

const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
});

const client = new pg.Client({
    host: 'localhost',
    port: 25432,
    user: 'pogo',
    password: 'pogo',
});

await client.connect();

type ColumnsInfo = {
    columnName: string;
    isNullable: boolean;
    dataType: string;
    enumName: string;
    enumValues: string[]
}[]

const query = await client.query<
    {
        tableName: string;
        columns: ColumnsInfo
    }
>(`
    SELECT table_name                                                                                 as "tableName",
           jsonb_agg(jsonb_build_object('columnName', column_name, 'isNullable', is_nullable = 'YES', 'dataType',
                                        data_type, 'enumName', enum_name, 'enumValues', enum_values)) as columns
    FROM information_schema.columns
             LEFT JOIN (select t.typname as         enum_name,
                               ARRAY_AGG(enumlabel) "enum_values"
                        from pg_type t
                                 join pg_enum e on t.oid = e.enumtypid
                                 join pg_catalog.pg_namespace n ON n.oid = t.typnamespace
                        GROUP BY 1) enums ON columns.data_type = 'USER-DEFINED' AND enums.enum_name = udt_name
    WHERE table_schema = 'public'
    GROUP BY table_name
    ORDER BY table_name
`);

function createInterface(tableName: string, columns: ColumnsInfo): ts.Node[] {
    const interfaceName = ts.factory.createIdentifier('I' + tableName);
    const properties: ts.PropertySignature[] = [];
    for (const {columnName, isNullable, dataType, enumName, enumValues} of columns) {
        const property =  ts.factory.createPropertySignature(
            undefined,
            ts.factory.createIdentifier(columnName),
            isNullable ?  ts.factory.createToken(ts.SyntaxKind.QuestionToken) : undefined,
            ts.factory.createTypeReferenceNode(dataType === 'USER-DEFINED' ? enumName : dataType),
        );
        properties.push(property);
    }
    const interfaceDeclaration = ts.factory.createInterfaceDeclaration(
        undefined,
        interfaceName,
        undefined,
        undefined,
        properties
    );
    return [interfaceDeclaration];
}

const nodes: ts.Node[] = [];
for (const {tableName, columns} of query.rows) {
    nodes.push(...createInterface(tableName, columns));
}

nodes.push(ts.factory.createExpressionStatement(
    ts.factory.createArrayLiteralExpression(
        query.rows.map(({tableName}) => ts.factory.createStringLiteral(tableName))
    )
))

console.log(printer.printList(ts.ListFormat.MultiLine, ts.factory.createNodeArray(nodes), sourceFile));

await client.end();
