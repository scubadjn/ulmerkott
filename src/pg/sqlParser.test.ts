import sqlCreateParser from './sqlCreateParser';

const parser = sqlCreateParser({
  namespace: 'auth',
  table: 'my_table',
  fieldMap: {
    title: 'title',
    myDescription: 'my_description',
  },
});

describe('sql parser', () => {
  test('returnFields', () => {
    expect(parser.returnFields).toEqual('id,title,my_description AS "myDescription"');
  });
  test('returnFieldsWithTable', () => {
    expect(parser.returnFieldsWithTable).toEqual('my_table.id,my_table.title,my_table.my_description AS "myDescription"');
  });
  test('returnFieldsObj', () => {
    expect(parser.returnFieldsObj).toEqual({
      id: 'my_table.id',
      title: 'my_table.title',
      myDescription: 'my_table.my_description AS "myDescription"',
    });
  });
  test('fieldWithTableObj', () => {
    expect(parser.fieldWithTableObj).toEqual({
      id: 'my_table.id',
      title: 'my_table.title',
      myDescription: 'my_table.my_description',
    });
  });
  test('insert', () => {
    expect(parser.insert({ title: 'hello', myDescription: 'world' })).toEqual({
      vars: '$2,$3',
      args: ['hello', 'world'],
      fields: 'id,title,my_description',
    });
  });
  test('insert', () => {
    expect(parser.insert({ myDescription: 'world', title: 'hello' })).toEqual({
      vars: '$2,$3',
      args: ['world', 'hello'],
      fields: 'id,my_description,title',
    });
  });
  test('insert-overrideid', () => {
    expect(parser.insert({ id: 'some-id', title: 'hello', myDescription: 'world' })).toEqual({
      vars: '$2,$3',
      args: ['hello', 'world'],
      fields: 'id,title,my_description',
    });
  });
  test('update', () => {
    expect(parser.update({ id: '1', title: 'hello', myDescription: 'world' })).toEqual({
      id: '1',
      vars: 'title = $2,my_description = $3',
      args: ['hello', 'world'],
    });
  });
});
