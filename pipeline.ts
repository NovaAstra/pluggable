//@ts-nocheck

import { afterEach } from "node:test";

export type Args<T = unknown> = ReadonlyArray<T>;

export type Middleware<I extends Args = unknown[], O = unknown> = (...inputs: I) => O

export type Middlewares<I extends Args = unknown[], O = unknown> = Middleware<I, O>[]

export type PipelineLike<I extends Args = unknown[], O = unknown> = { middlewares: Middlewares<I, O> }

export type MiddlewareInput<I extends Args = unknown[], O = unknown> =
  | Middleware<I, O>
  | Middlewares<I, O>
  | PipelineLike<I, O>

export function isMiddleware<I extends Args, O>(input: unknown): input is Middleware<I, O> {
  return typeof input === 'function';
}

export function isMiddlewares<I extends Args, O>(input: unknown): input is Middlewares<I, O> {
  return Array.isArray(input);
}

export function isPipelineLike<I extends Args, O>(input: unknown): input is PipelineLike<I, O> {
  return typeof input === 'object' && input !== null && 'middlewares' in input;
}

export function getMiddlewares<I extends Args, O>(
  input: MiddlewareInput<I, O>
): Middlewares<I, O> {
  if (isMiddleware<I, O>(input))
    return [input]

  if (isMiddlewares<I, O>(input))
    return input.flatMap(getMiddlewares);


  if (isPipelineLike<I, O>(input))
    return getMiddlewares(input.middlewares);

  throw new Error(`The provided input is of type ${input}, but a Middleware, Middlewares array, 
      or PipelineLike object was expected.`);
}


export abstract class Pipeline<I extends Args = unknown[], O = unknown> implements PipelineLike<I, O> {
  public readonly middlewares: Middlewares<I, O> = [];

  public use(...inputs: MiddlewareInput<I, O>[]): Pipeline<I, O> {
    this.middlewares.push(...inputs.flatMap(getMiddlewares));
    return this as Pipeline<I, O>;
  }

  public run(...inputs: I): O | void {
    return this.dispatch(0, inputs)
  }

  public abstract dispatch(index: number, inputs: I): O;
}

// export class SyncHook<I extends Args = unknown[], O = unknown> extends Pipeline<I, O> {
//   public dispatch(index: number, input: I): void {
//     if (index >= this.middlewares.length) return;
//     this.middlewares[index](input)
//     this.dispatch(index + 1, input)
//   }
// }

// export class SyncBailHook<I = unknown, O = unknown> extends Pipeline<I, O> {
//   public dispatch(index: number, input: I): void {
//     if (index >= this.middlewares.length) return;
//     const middleware = this.middlewares[index]
//     const result = middleware(input)
//     result === undefined && this.dispatch(index + 1, input)
//   }
// }

export class SyncWaterfallHook<I extends Args = unknown[], O = unknown> extends Pipeline<I, O> {
  public dispatch(index: number, inputs: I): void {
    if (index >= this.middlewares.length) return;
    const middleware = this.middlewares[index]
    const result = middleware(...inputs)
    this.dispatch(index + 1, result === undefined ? inputs : [result, ...inputs])
  }
}

export type Hook = () => void

export type Api = () => void

export type Plugin = {}

export class Pluggable<
  H extends Record<string, Hook>,
  A extends Record<string, Api>
> {
  public readonly plugins: Map<string, Plugin> = new Map()

  public constructor(hooks?: Partial<H>, api?: A) {

  }

  public reset(): void {
    this.plugins.clear()
  }
}