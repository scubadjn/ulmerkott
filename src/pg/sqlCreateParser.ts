type Columns = { [key: string]: string };

interface Props {
  namespace: string;
  table: string;
  fieldMap: Columns;
}

export default function sqlCreateParser(props: Props) {
  const colWt: string[] = [];
  const col: string[] = [];
  const returnFieldObject: Columns = {
    id: `${props.table}.id`,
  };
  const fieldObject: Columns = {
    id: `${props.table}.id`,
  };
  Object.keys(props.fieldMap).forEach(key => {
    const columnName = props.fieldMap[key];
    fieldObject[key] = `${props.table}.${columnName}`;
    if (columnName.includes('_')) {
      const wtVal = `${props.table}.${columnName} AS "${key}"`;
      returnFieldObject[key] = wtVal;
      colWt.push(wtVal);
      col.push(`${columnName} AS "${key}"`);
    } else {
      const wtVal = `${props.table}.${columnName}`;
      returnFieldObject[key] = wtVal;
      colWt.push(wtVal);
      col.push(columnName);
    }
  });

  const withTable =  colWt.join(',');
  const coulmns = col.join(',');
  return {
    returnFields: `id,${coulmns}`,
    returnFieldsWithTable: `${props.table}.id,${withTable}`,
    returnFieldsObj: returnFieldObject,
    fieldWithTableObj: fieldObject,
    insert: (rawInput: any) => {
      const input = {...rawInput};
      delete input.id;
      const v: number[] = [];
      const args: any[] = [];
      const f: string[] = [];
      Object.keys(props.fieldMap).forEach((key) => {
        f.push(props.fieldMap[key]);
      });
      Object.keys(input).forEach((key, index) => {
        args.push(input[key]);
        v.push(index + 1);
      });
      return {
        vars: v.map(i => `$${i + 1}`).join(','),
        args,
        fields: `id,${f.join(',')}`,
      };
    },
    update: (input: any) => {
      const { id } = input as any;
      const args: any[] = [];
      const vars: any[] = [];
      delete input.id;
      let i = 1;
      Object.keys(input).forEach((key) => {
        const uv = props.fieldMap[key];
        if (uv !== undefined) {
          i += 1;
          args.push(input[key]);
          vars.push(`${props.fieldMap[key]} = $${i}`);
        }
      });
      return {
        id,
        vars: vars.join(','),
        args,
      };
    },
    delete: (input: any) => {
      const args: any[] = [];
      const vars: any[] = [];
      delete input.id;
      let i = 0;
      Object.keys(input).forEach((key) => {
        const uv = props.fieldMap[key];
        if (uv !== undefined) {
          i += 1;
          args.push(input[key]);
          vars.push(`${props.fieldMap[key]} = $${i}`);
        }
      });
      return {
        vars: vars.join(','),
        args,
      };
    },
  };
}