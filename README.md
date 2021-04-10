# Generate CRUD layer for postgresql

```
npm install --save ulmerkott
npm install dataloader@^2.0.0 pg@^8.5.1
```
```
yarn add ulmerkott
yarn add dataloader@^2.0.0 pg@^8.5.1
```

## Factory setup:
```ts
import { crudFactory, settings, sql, SQLStringFilter, SQLBoolFilter } from 'ulmerkott/pg';

const crud = crudFactory(settings({
  namespace: 'scuba',
  createId: master.createID,
  db: (ctx: Ctx) => ctx.pg.scuba as any,
}));

## Table setup:
```ts

interface MyTable {
  id: string;
  title: string;
  someOtherColumn: number;
}

const config = {
  name: 'my_table'
  columns: {
    title: 'title',
    someOtherColumn: 'some_other_column',
  },
};

const myTable = makeCrud<typeof config.columns, MyTable>({ config });
```

## Table usage:
```ts
await myTable.crud.insertOne(ctx, { Promise<MyTable>
  name: 'hello',
  someOtherColumn: 'world',
});
await myTable.crud.findOne(ctx, 'some_id'); // Promise<MyTable | null>
await myTable.crud.getOne(ctx, 'some_id'); // Promise<MyTable>
await myTable.crud.updateOne(ctx, {
  id: 'some_id',
  name: 'hello',
  someOtherColumn: 'world',
});
await myTable.crud.deleteOne(ctx, 'some_id'); // Promise<MyTable>
await myTable.crud.list(ctx); // Promise<MyTable[]>
```
## Filter:
```ts
const config = {
  /* ... */
  listOptions: {
    name: { eq: 'name' },
    someOtherColumn: { eq: 'someOtherColumn' },
  },
};

const myTable = makeCrud<typeof config.columns, MyTable, {
  filter?: UmkFilter<{
    name: string;
    someOtherColumn: string;
  }>
}>({ config });

await myTable.crud.list(ctx, {
  filter: {
    name: { eq: 'hello' },
    someOtherColumn: { eq: 1 },
  }
}); // Promise<MyTable[]>
```
