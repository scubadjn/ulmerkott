export { sql, SQLStringFilter, SQLBoolFilter } from './sql';
export { factorySettings as settings } from '../index';
import { WithFilterConfig } from './sqlCreateWithFilter';
import { FactorySettingResult, UlmerkottConfig } from '../index';
import * as Pg from 'pg';
import { makeCrud } from './sql';

interface FactoryProps {
  listOptions?: WithFilterConfig;
  tableConfig: {
    name: string
    c: { [key: string]: string };
  },
}

interface PropsParent<C> {
  config: UlmerkottConfig<any>
  namespace: string
  db: (ctx: C) => Pg.Client
}

function createMakeCrud<C>({ namespace }: PropsParent<C>) {
  return function <Columns, DataObj, ListInput = undefined>({ config, tableConfig, listOptions }: {
    config: UlmerkottConfig<C>
    tableConfig: {
      name: string
      c: { [key: string]: string };
    }
    listOptions?: WithFilterConfig;
  }) {
    type Update = Partial<DataObj> & { id: string };
    return makeCrud<Columns, DataObj, Omit<DataObj, 'id'>, Update, ListInput, Partial<Omit<DataObj, 'id'>>>({
      config,
      namespace,
      table: tableConfig.name,
      fieldMap: tableConfig.c,
      listOptions,
    });
  };
}

export function crudFactory<C>(settings: FactorySettingResult<C>) {
  const { config } = settings;
  function build<Columns, DataObj, ListInput = undefined>(props: FactoryProps) {
    return  createMakeCrud<C>({ namespace: config.namespace, db: config.db, config })<Columns, DataObj, ListInput>({
      config,
      tableConfig: props.tableConfig,
      listOptions: props.listOptions,
    });
  }
  return build;
}
