export type Next<I, O> = (input?: I) => O

export type Middleware<I = unknown, O = unknown> = (input: I, next: Next<I, O>) => O

export type Middlewares<I = unknown, O = unknown> = Middleware<I, O>[]

export type PipelineLike<I = unknown, O = unknown> = { middlewares: Middlewares<I, O> }

export type MiddlewareInput<I = unknown, O = unknown> =
  | Middleware<I, O>
  | Middlewares<I, O>
  | PipelineLike<I, O>

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
    return input.flatMap(getMiddlewares);


  if (isPipelineLike<I, O>(input))
    return getMiddlewares(input.middlewares);

  throw new Error(`The provided input is of type ${input}, but a Middleware, Middlewares array, 
      or PipelineLike object was expected.`);
}


export abstract class Pipeline<I = unknown, O = unknown> implements PipelineLike<I, O> {
  public readonly middlewares: Middlewares<I, O> = [];

  public use(...inputs: MiddlewareInput<I, O>[]): Pipeline<I, O> {
    this.middlewares.push(...inputs.flatMap(getMiddlewares));
    return this as Pipeline<I, O>;
  }
}

export class SyncHook<I = unknown, O = unknown> extends Pipeline<I, O> {
}

const runner = new SyncHook()

runner.use(() => {
  console.log(1)
})