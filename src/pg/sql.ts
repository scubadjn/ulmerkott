import * as Pg from 'pg';
import * as Dataloader from 'dataloader';
import sqlCreateParser from './sqlCreateParser';
import withFilter, { WithFilterConfig } from './sqlCreateWithFilter';
import { UlmerkottConfig } from '../index';
import DbError from '../error';
import { makeQueries } from './queries';

export const sql = (strings: TemplateStringsArray, ...expr: any[]) => {
  return strings
    .map((str, index) => str + (expr.length > index ? String(expr[index]) : ''))
    .join('');
};

export type SQLStringFilter = {
  eq?: string | null;
} | null;

export type SQLBoolFilter = {
  eq?: boolean | null;
} | null;

interface PropsParent<Ctx> {
  config: UlmerkottConfig<Ctx>
  namespace: string
  db: (ctx: Ctx) => Pg.Client
}

interface Props<Ctx> extends Omit<PropsParent<Ctx>, 'db'> {
  config: UlmerkottConfig<any>
  table: string
  fieldMap: { [key: string]: string };
  listOptions?: WithFilterConfig;
}


export function makeCrud<Columns, DataObj, Create, Update, ListInput = undefined, DeleteMany = undefined, Ctx = any>(props: Props<Ctx>) {
  const { namespace, table, fieldMap = {}, config } = props;
  const { db } = config;
  const parser = sqlCreateParser({ namespace, table, fieldMap });
  const query = makeQueries(props);
  async function findOne(ctx: Ctx, id: string) {
    const { text, values } = query.findOne(id);
    try {
      const result = await db(ctx).query<DataObj>({ text, values });
      const [obj] = result.rows;
      if (!obj) return null;
      return obj;
    } catch (e) {
      throw new DbError(namespace, table, 'findOne', e);
    }
  }
  async function listAll(ctx: Ctx, input?: ListInput) {
    const { text, values } = query.listAll(input);
    try {
      const result = await db(ctx).query<DataObj>({ text, values });
      return result.rows;
    } catch (e) {
      throw new DbError(namespace, table, `list: ${text}`, e);
    }
  }
  async function count(ctx: Ctx, input?: Omit<ListInput, 'order'>) {
    const { text, values } = query.count(input);
    try {
      const result = await db(ctx).query<{ count: number }>({ text, values });
      return result.rows[0].count;
    } catch (e) {
      throw new DbError(namespace, table, `count: ${text}`, e);
    }
  }
  async function getOneById(ctx: Ctx, id: string) {
    const result = await findOne(ctx, id);
    if (!result) throw new DbError(namespace, table, 'does not excist');
    return result;
  }
  async function insertOne(ctx: Ctx, input: Create) {
    const { text, values } = query.insertOne(input);
    try {
      const result = await db(ctx).query<DataObj>({ text, values });
      const [obj] = result.rows;
      if (!obj) throw new DbError(namespace, table, 'insertOne - no result');
      return obj;
    } catch (e) {
      throw new DbError(namespace, table, 'insertOne', e);
    }
  }
  async function updateOne(ctx: Ctx, input: Update) {
    const { text, values } = query.updateOne(input);
    try {
      const result = await db(ctx).query<DataObj>({ text, values });
      const [obj] = result.rows;
      if (!obj) throw new DbError(namespace, table, 'updateOne - not updated');
      return obj;
    } catch (e) {
      throw new DbError(namespace, table, 'updateOne', e);
    }
  }
  async function deleteOne(ctx: Ctx, id: string) {
    const { text, values } = query.deleteOne(id);
    try {
      const result = await db(ctx).query<DataObj>({ text, values });
      const [obj] = result.rows;
      if (!obj) throw new DbError(namespace, table, 'deleteOne - no result');
      return obj;

    } catch (e) {
      throw new DbError(namespace, table, 'deleteOne', e);
    }
  }
  async function deleteMany(ctx: Ctx, input: DeleteMany) {
    if (!Object.keys(input).length) throw new DbError(namespace, table, 'deleteMany - no input');
    const { text, values } = query.deleteMany<DeleteMany>(input);
    try {
      await db(ctx).query({ text, values });
      return true;
    } catch (e) {
      throw new DbError(namespace, table, `deleteMany: ${text}`, e);
    }
  }
  function loadById(ctx: Ctx) {
    return new Dataloader<string, DataObj>(async ids => {
      const { text, values } = query.loadById(ids);
      try {
        const result = await db(ctx).query<DataObj>({ text, values });
        return result.rows;
      } catch (e) {
        throw new DbError(namespace, table, 'loadById', e);
      }
    });
  }
  type TableColumns = Columns & { id: string };
  return {
    query: <Qr = DataObj>(ctx: Ctx, config: Pg.QueryConfig) => db(ctx).query<Qr>(config),
    error: (message: string, e?: Error) => new DbError(namespace, table, message, e),
    withFilter,
    crud: {
      loadById,
      insertOne,
      findOne,
      deleteOne,
      deleteMany,
      updateOne,
      getOneById,
      listAll,
      count,
    },
    table,
    resField: parser.returnFieldsWithTable,
    qField: parser.fieldWithTableObj as unknown as TableColumns,
  };
}
