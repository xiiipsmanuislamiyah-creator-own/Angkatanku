import type { Express, Request, Response, RequestHandler } from "express";
import type { Principal } from "./security";
import type { Store, RecordData } from "./store";

export interface Domain {
  app: Express;
  store: Store;
  wrap: (fn: (req: Request, res: Response) => any) => RequestHandler;
  writeUser: (req: Request, res: Response) => Principal;
  config: () => Promise<RecordData>;
  mutation: <T>(
    p: Principal,
    keys: string[],
    action: string,
    target: string,
    fn: (rows: (RecordData | null)[]) => {
      value: T;
      writes?: Record<string, RecordData | null>;
    },
  ) => Promise<T>;
}
