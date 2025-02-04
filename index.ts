//@ts-nocheck
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

const PipelineSymbol = Symbol.for('PLUGGABLE_PIPELINE');

export class Context<I> {
  private currentValue: I;

  public constructor(input: I) {
    this.currentValue = input;
  }

  public use() {
    return new Proxy(this as Context<I>, {
      get(target, prop) {
        if (prop === 'value') {
          return target.get();
        }
        return Reflect.get(target, prop);
      },
      set(target, prop, value) {
        if (prop === 'value') {
          target.set(value as I);
          return true
        }
        return Reflect.set(target, prop, value);
      },
    });
  }

  public get(): I {
    return this.currentValue;
  }

  public set(input: I): I {
    return this.currentValue = input;
  }
}

export class Pipeline<I, O> implements PipelineLike<I, O> {
  public readonly middlewares: Middlewares<I, O> = [];

  public use(...inputs: MiddlewareInput<I, O>[]): Pipeline<I, O> {
    this.middlewares.push(...inputs.flatMap(getMiddlewares));
    return this as Pipeline<I, O>;
  }

  public run(input: I) {
    return this.dispatch(0, input)
  }

  public dispatch(index: number, input: I) {
    const callback = this.middlewares[index]
    const next: Next<I, O> = (_input: I = input) => this.dispatch(index + 1, _input)
    return callback(input, next)
  }

  public readonly [PipelineSymbol] = true;
}

export abstract class Pluggable {
  public readonly plugins: Map<string, Plugin> = new Map()

  public reset() {
    this.plugins.clear()
  }
}

export class Beacon extends Pluggable { }

export function isPipeline<I, O>(input: unknown): input is Pipeline<I, O> {
  return Boolean((input as Pipeline<I, O>)?.[PipelineSymbol]);
}

export function isMiddleware<I, O>(input: unknown): input is Middleware<I, O> {
  return typeof input === 'function';
}

export function isMiddlewares<I, O>(input: unknown): input is Middlewares<I, O> {
  return Array.isArray(input);
}

export function isPipelineLike<I, O>(input: unknown): input is PipelineLike<I, O> {
  return typeof input === 'object' && input !== null && 'middlewares' in input;
}

export function getMiddlewares<I, O>(
  input: MiddlewareInput<I, O>
): Middlewares<I, O> {
  if (isMiddleware<I, O>(input))
    return [input]

  if (isMiddlewares<I, O>(input))
    return input.flatMap(middleware => getMiddlewares(middleware));


  if (isPipelineLike<I, O>(input))
    return getMiddlewares(input.middlewares);

  throw new Error(`The provided input is of type ${input}, but a Middleware, Middlewares array, 
    or PipelineLike object was expected.`);
}

export function createContext<I>(input: I) {
  const context = new Context<I>(input);
  return context
}

export function createPipeline<I, O>() {
  const pipeline = new Pipeline<I, O>()
  return pipeline
}

export function createHooks() { }

export function createApis() { }

export function defineConfig() {
  const beacon = new Beacon()
  return beacon
}

function pluginA() {
  return {
    name: "PluginA",
    setup(api, context) {
      api.useConfigContext()
      api.useAppContext()

      return {
        beforeCreated() { },
        created() { }
      }
    }
  }
}

function makeRunner<Hooks extends Record<string, any>>(
  hooks: Hooks
) {
  const runner = Object.create()
}