export { sql, SQLStringFilter, SQLBoolFilter } from './sql';
export { factorySettings as settings } from '../index';
import { WithFilterConfig } from './sqlCreateWithFilter';
import { FactorySettingResult } from '../index';
import { pgEngine } from './sql';

interface FactoryProps {
  listOptions?: WithFilterConfig;
  tableConfig: {
    name: string
    c: { [key: string]: string };
  },
}

export function crudFactory<C>(settings: FactorySettingResult<C>) {
  const { config } = settings;
  function build<Columns, DataObj, ListInput = undefined>(props: FactoryProps) {
    type Update = Partial<DataObj> & { id: string };
    type Create = Omit<DataObj, 'id'> & { id?: string };
    return  pgEngine<Columns, DataObj, Create, Update, ListInput, Partial<Omit<DataObj, 'id'>>>({
      config,
      table: props.tableConfig.name,
      fieldMap: props.tableConfig.c,
      listOptions: props.listOptions,
    });
  }
  return build;
}
