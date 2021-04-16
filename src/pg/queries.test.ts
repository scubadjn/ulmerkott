import { makeQueries } from './queries';

const query = makeQueries({
  table: 'my_table',
  config: {
    namespace: 'asd',
    createId: () => Math.random().toString(36).substring(7),
    db: ctx => ctx,
  },
  fieldMap: {
    title: 'title',
    myDescription: 'my_description',
  },
  listOptions: {
    filter: { title: { eq: 'title' } },
  },
});

describe('sql query', () => {
  test('findOne', () => {
    const res = query.findOne('idc');
    expect(res.values).toEqual(['idc']);
    expect(res.text).toEqual(`
      SELECT
        my_table.id,my_table.title,my_table.my_description AS \"myDescription\"
      FROM
        my_table
      WHERE
        my_table.id = $1
    `);
  });
  test('deleteOne', () => {
    const res = query.deleteOne('id');
    expect(res.values).toEqual(['id']);
    expect(res.text).toEqual(`
      DELETE FROM
        my_table
      WHERE
        id = $1
      RETURNING
        my_table.id,my_table.title,my_table.my_description AS \"myDescription\"
    `);
  });
  test('updateOne', () => {
    const res = query.updateOne({ id: 'id', title: 'new title' });
    expect(res.values).toEqual(['id', 'new title']);
    expect(res.text).toEqual(`
      UPDATE
        my_table
      SET
        title = $2
      WHERE
        id = $1
      RETURNING
        my_table.id,my_table.title,my_table.my_description AS \"myDescription\"
    `);
  });
  test('deleteMany', () => {
    const res = query.deleteMany({ title: 'hello' });
    expect(res.values).toEqual(['hello']);
    expect(res.text).toEqual(`
      DELETE FROM
        my_table
      WHERE
        title = $1
    `);
  });
});
