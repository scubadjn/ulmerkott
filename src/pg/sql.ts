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
}

interface Props<Ctx> extends Omit<PropsParent<Ctx>, 'db'> {
  config: UlmerkottConfig<any>
  table: string
  fieldMap: { [key: string]: string };
  listOptions?: WithFilterConfig;
}

export function pgEngine<Columns, DataObj, Create, Update, ListInput = undefined, DeleteMany = undefined, Ctx = any>(props: Props<Ctx>) {
  const { table, fieldMap = {}, config } = props;
  const db = <R = DataObj>(c: Ctx) => (input: Pg.QueryConfig) => config.db(c).query<R>(input);
  const err = (msg: string, e?: Error) => new DbError(config.namespace, table, msg, e);
  const parser = sqlCreateParser({ namespace: config.namespace, table, fieldMap });
  const query = makeQueries(props);

  async function findOne(ctx: Ctx, id: string) {
    const { text, values } = query.findOne(id);
    try {
      const { rows: [obj] } = await db(ctx)({ text, values });
      if (!obj) return null;
      return obj;
    } catch (e) {
      throw err('findOne', e);
    }
  }
  async function listAll(ctx: Ctx, input?: ListInput) {
    const { text, values } = query.listAll(input);
    try {
      const { rows } = await db(ctx)({ text, values });
      return rows;
    } catch (e) {
      throw err('listAll', e);
    }
  }
  async function count(ctx: Ctx, input?: Omit<ListInput, 'order'>) {
    const { text, values } = query.count(input);
    try {
      const { rows: [obj] } = await db<{ count: number }>(ctx)({ text, values });
      return obj.count;
    } catch (e) {
      throw err('count', e);
    }
  }
  async function getOneById(ctx: Ctx, id: string) {
    const result = await findOne(ctx, id);
    if (!result) throw err('does not excist');
    return result;
  }
  async function insertOne(ctx: Ctx, input: Create) {
    const { text, values } = query.insertOne(input);
    try {
      const { rows: [obj] } = await db(ctx)({ text, values });
      if (!obj) throw err('insertOne - no result');
      return obj;
    } catch (e) {
      throw err('insertOne', e);
    }
  }
  async function updateOne(ctx: Ctx, input: Update) {
    const { text, values } = query.updateOne(input);
    try {
      const { rows: [obj] } = await db(ctx)({ text, values });
      if (!obj) throw err('updateOne - not updated');
      return obj;
    } catch (e) {
      throw err('updateOne', e);
    }
  }
  async function deleteOne(ctx: Ctx, id: string) {
    const { text, values } = query.deleteOne(id);
    try {
      const result = await db(ctx)({ text, values });
      const [obj] = result.rows;
      if (!obj) throw err('deleteOne - no result');
      return obj;
    } catch (e) {
      throw err('deleteOne', e);
    }
  }

  async function deleteMany(ctx: Ctx, input: DeleteMany) {
    if (!Object.keys(input).length) throw err('deleteMany - no input');
    const { text, values } = query.deleteMany<DeleteMany>(input);
    try {
      await db(ctx)({ text, values });
      return true;
    } catch (e) {
      throw err('deleteMany', e);
    }
  }
  function loadById(ctx: Ctx) {
    return new Dataloader<string, DataObj>(async ids => {
      const { text, values } = query.loadById(ids);
      try {
        const { rows } = await db(ctx)({ text, values });
        return rows;
      } catch (e) {
        throw err('loadById', e);
      }
    });
  }
  type TableColumns = Columns & { id: string };
  return {
    query: <Qr = DataObj>(ctx: Ctx, config: Pg.QueryConfig) => db<Qr>(ctx)(config),
    error: (message: string, e?: Error) => new DbError(config.namespace, table, message, e),
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
