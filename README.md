# Generate CRUD layer for postgresql

```
npm install --save ulmerkott
npm install dataloader@^2.0.0 pg@^8.5.1
```
```
yarn add ulmerkott
yarn add dataloader@^2.0.0 pg@^8.5.1
```

## setup:
```ts
import { crudFactory, settings, sql, SQLStringFilter, SQLBoolFilter } from 'ulmerkott/pg';

const crud = crudFactory(settings({
  namespace: 'ulmerkott',
  createId: master.createID,
  db: (ctx: Ctx) => ctx.pg.somePgClient,
}));
```
## configure:
```ts
// create an interface for the table
interface MyTable {
  id: string;
  title: string;
  someOtherColumn: number;
}
const tableConfig = {
  name: 'my_table'
  c: {
    title: 'title',
    someOtherColumn: 'some_other_column',
  },
};

const listOptions = { // optional
  filter: { title: { eq?: tableConfig.c.title } },
};

const myTable = makeCrud<typeof config.c, MyTable, {
  filter: { eq?: SQLStringFilter } ,
}>({ tableConfig, listOptions });
```

### use:
```ts
// insert record => Promise<MyTable>
await myTable.crud.insertOne(ctx, {
  name: 'hello',
  someOtherColumn: 'world',
});

// find one record => Promise<MyTable | null>
await myTable.crud.findOne(ctx, 'some_id');

// find one record that excists => Promise<MyTable>
await myTable.crud.getOne(ctx, 'some_id');

// update record by id => Promise<MyTable>
await myTable.crud.updateOne(ctx, {
  id: 'some_id',
  name: 'hello',
  someOtherColumn: 'world',
});

// delete record by id => Promise<MyTable>
await myTable.crud.deleteOne(ctx, 'some_id');

// get all records
await myTable.crud.list(ctx); // Promise<MyTable[]>

// get all records, filter where title = hello
await myTable.crud.list(ctx, { title: { eq: 'hello }); // Promise<MyTable[]>
```
