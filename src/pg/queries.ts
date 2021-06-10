import sqlCreateParser from './sqlCreateParser';
import withFilter, { WithFilterConfig } from './sqlCreateWithFilter';
import { UlmerkottConfig } from '../index';
import DbError from '../error';

export const sql = (strings: TemplateStringsArray, ...expr: any[]) => {
  return strings
    .map((str, index) => str + (expr.length > index ? String(expr[index]) : ''))
    .join('');
};

interface Props<Ctx> {
  config: UlmerkottConfig<Ctx>
  table: string
  fieldMap: { [key: string]: string };
  listOptions?: WithFilterConfig;
}

export function makeQueries<Ctx = any>(props: Props<Ctx>) {
  const { table, fieldMap = {}, listOptions, config } = props;
  const { namespace } = config;
  const parser = sqlCreateParser({ namespace, table, fieldMap });
  function findOne(id: string) {
    const text = sql`
      SELECT
        ${parser.returnFieldsWithTable}
      FROM
        ${table}
      WHERE
        ${table}.id = $1
    `;
    return {
      text,
      values: [id],
    };
  }
  function listAll<ListInput = any>(input?: ListInput) {
    const wf = listOptions ? withFilter(listOptions) : undefined;
    const r = wf ? wf(input) : { input: '', args: [] };
    const text = sql`
      SELECT
        ${parser.returnFieldsWithTable}
      FROM
        ${table}
      ${r.input}
    `;
    return { text, values: r.args };
  }
  function count<ListInput = any>(input?: Omit<ListInput, 'order'>) {
    const wf = listOptions ? withFilter(listOptions) : undefined;
    const r = wf ? wf(input) : { input: '', args: [] };
    const text = sql`
      SELECT
        COUNT(*)
      FROM
        ${table}
      ${r.input}
    `;
    return { text, values: r.args };
  }
  function insertOne<Create = any>(input: Create) {
    const ins = parser.insert(input);
    const { id } = input as any;
    return {
      text: sql`
      INSERT into ${table} (
        ${ins.fields}
      ) VALUES ($1,${ins.vars})
      RETURNING
        ${parser.returnFieldsWithTable}
      `,
      values: [
        id ? id : config.createId(),
        ...ins.args,
      ],
    };
  }
  function updateOne<Update>(input: Update) {
    const upd = parser.update(input);
    const text = sql`
      UPDATE
        ${table}
      SET
        ${upd.vars}
      WHERE
        id = $1
      RETURNING
        ${parser.returnFieldsWithTable}
    `;
    return {
      text,
      values: [
        upd.id,
        ...upd.args,
      ],
    };
  }
  function deleteOne(id: string) {
    const text = sql`
      DELETE FROM
        ${table}
      WHERE
        id = $1
      RETURNING
        ${parser.returnFieldsWithTable}
    `;
    return {
      text,
      values: [id],
    };
  }
  function deleteMany<DeleteMany>(input: DeleteMany) {
    if (!Object.keys(input).length) throw new DbError(namespace, table, 'deleteMany - no input');
    const upd = parser.delete(input);
    const text = sql`
      DELETE FROM
        ${table}
      WHERE
        ${upd.vars}
    `;
    return { text, values: upd.args };
  }
  function loadById(ids: Readonly<string[]>) {
    return {
      text: sql`
      SELECT
        ${parser.returnFieldsWithTable}
      FROM
        ${table}
      WHERE id = ANY($1::uuid[])
    `,
      values: [ids],
    };
  }
  return {
    loadById,
    insertOne,
    findOne,
    deleteOne,
    deleteMany,
    updateOne,
    listAll,
    count,
  };
}
