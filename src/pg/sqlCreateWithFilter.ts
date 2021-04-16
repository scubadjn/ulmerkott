type SQLFilterConfig = {
  eq?: string | null;
} | null;

type Sort = 'asc' | 'desc';

export interface WithFilterConfig {
  filter?: {
    [key: string]: SQLFilterConfig
  },
  join?: string,
  order?: {
    [key: string]: string;
  };
}

export type WithFilter = typeof withFilter;
export default function withFilter<T>(config: WithFilterConfig) {
  return (props?: T) => {
    if (!props) return { input: '', args: [] };
    const p = props as any;
    const c = config as any;
    const filter = p.filter || {};
    const order = p.order || {};
    const args: string[] = [];
    const where: string[] = [];
    let argNr = 1;
    Object.keys(filter).forEach((key) => {
      const filterValue = filter[key];
      const filterColumn = c.filter[key];
      if (!filterColumn.eq) {
        throw new Error(`invalid ${filterColumn} for table`);
      }
      if (typeof filterValue.eq !== 'undefined') {
        if (!where.length) {
          where.push(` WHERE ${filterColumn.eq} = $${argNr}`);
        } else {
          where.push(` AND ${filterColumn.eq} = $${argNr}`);
        }
        args.push(filterValue.eq);
      }
      argNr += 1;
    });
    Object.keys(order).forEach((key) => {
      const orderValue = order[key] as Sort;
      const orderColumn = c.order[key];
      where.push(` ORDER BY ${orderColumn} ${orderValue === 'asc' ? 'ASC' : 'DESC'}`);
      argNr += 1;
    });
    const input = `${config.join ? config.join : ''}${where.join('')}`;
    return { input, args };
  };
}