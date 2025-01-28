
export type Promisable<T = unknown> = T | Promise<T>;

export type Next<I = unknown, O = unknown> = (
  input?: I
) => Promisable<O>;

export type Middleware<I = unknown, O = unknown> = (
  input: I,
  next: Next<I, O>,
) => Promisable<O>;

export type Middlewares<I = unknown, O = unknown> =
  Middleware<I, O>[];

export type PipelineLike<I = unknown, O = unknown> =
  { middlewares: Middlewares<I, O> };

export type MiddlewareInput<I = unknown, O = unknown> =
  | Middleware<I, O>
  | Middlewares<I, O>
  | PipelineLike<I, O>;

export interface Plugin {
  name: string;
}

export class Context<T> {
  private currentValue: T;

  public constructor(input: T) {
    this.currentValue = input;
  }

  public use() {
    return new Proxy(this as Context<T>, {
      get(target, prop) {
        if (prop === 'value') {
          return target.get();
        }
        return Reflect.get(target, prop);
      },
      set(target, prop, value) {
        if (prop === 'value') {
          target.set(value);
          return true
        }
        return Reflect.set(target, prop, value);
      },
    });
  }

  public get(): T {
    return this.currentValue;
  }

  public set(input: T): T {
    return this.currentValue = input;
  }
}

export class Pipeline {
  public use() { }

  public run() { }

  public dispatch() { }
}

export function getMiddleware() { }

export function createContext() { }

export function createPipeline() { }

export function createHooks() { }

export function createApis() { }