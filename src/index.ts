import { Client } from 'pg';

export interface UlmerkottConfig<C> {
  namespace: string;
  logQueries?: (sqlQuery: string, args: any[]) =>  void;
  createId: () => string;
  db: (ctx: C) => Client;

}

export function umk(t: any) {
  const wtn = {} as any;
  Object.keys(t).forEach(tn => {
    Object.keys(t[tn]).forEach(() => {
      if (!wtn[tn]) {
        wtn[tn] = {};
      }
      if (!wtn[tn].name) {
        wtn[tn].name = t[tn].name;
      }
      if (!wtn[tn].c) {
        wtn[tn].c = {};
      }
      Object.keys(t[tn].c).map(i => {
        const coll = t[tn].c[i];
        wtn[tn].c[i] = `${wtn[tn].name}.${coll}`;
      });
    });
  });
  return wtn;
}

export interface FactorySettingResult<C> {
  config: UlmerkottConfig<C>;
  umk: typeof umk
}

export function factorySettings<C>(config: UlmerkottConfig<C>): FactorySettingResult<C> {
  return {
    config,
    umk,
  };
}
