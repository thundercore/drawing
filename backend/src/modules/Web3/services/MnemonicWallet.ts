import { Wallet } from "ethers/wallet";
import {
  Provider,
  TransactionRequest,
  TransactionResponse
} from "ethers/providers/abstract-provider";
import { HDNode } from "ethers/utils/hdnode";
import { NONCE_EXPIRED } from "ethers/errors";
import {
  defer,
  Observable,
  Subject,
  NEVER,
  interval,
  EMPTY,
  merge
} from "rxjs";
import {
  distinctUntilChanged,
  catchError,
  filter,
  map,
  mapTo,
  switchMap,
  take,
  takeUntil,
  share,
  timeout
} from "rxjs/operators";
import { Arrayish, SigningKey } from "ethers/utils";
import { retryBackoff } from "backoff-rxjs";
import { Redis } from "ioredis";
import { RedisFactory } from "../../../redis/redisFactory";
import { DRAWING_NONCE_PREFIX } from "../../../redis/redisConstant";

// WARNING!! this will fail if you are using ganache because it doesn't accept transactions with higher nonces
export class NonceHandlingWallet extends Wallet {
  private readonly EMPTY_TRANSACTION: TransactionRequest;
  private readonly reset$ = new Subject();

  private nonceChange$: Observable<number>;

  private initializeNoncePromise: Promise<number>;
  private redis: Redis;

  constructor(
    privateKey: SigningKey | HDNode | Arrayish,
    provider: Provider,
    redisFactory: RedisFactory,
    private timeoutMs = 5 * 60 * 1000
  ) {
    super(privateKey, provider);
    this.redis = redisFactory.getInstance();
    this.EMPTY_TRANSACTION = {
      to: this.address,
      value: "0x0"
    };
    this.watchTransactionReceipt = this.watchTransactionReceipt.bind(this);
    this.sendTransactionObservable = this.sendTransactionObservable.bind(this);
    this.nonceChange$ = this.watchNonce();
    this.initialize();
  }

  protected initialize() {
    this.redis.set(`${DRAWING_NONCE_PREFIX}${this.address}`, -1);
    this.initializeNoncePromise = this.getTransactionCount();
    this.reset$.next();
  }

  protected assignNonce(
    transaction: TransactionRequest
  ): Observable<TransactionRequest> {
    return defer(async () => {
      const nonce = (await this.initializeNoncePromise) - 1;
      const nonceOnRedis = await this.redis.get(
        `${DRAWING_NONCE_PREFIX}${this.address}`
      );

      if (
        !nonceOnRedis ||
        +nonceOnRedis === -1 ||
        nonce > +nonceOnRedis + 100
      ) {
        console.log(
          `set nonce ${nonce} to redis ${DRAWING_NONCE_PREFIX}${this.address}`
        );
        await this.redis.set(`${DRAWING_NONCE_PREFIX}${this.address}`, nonce);
      }
      transaction.nonce = await this.redis.incr(
        `${DRAWING_NONCE_PREFIX}${this.address}`
      );
      // console.log("transaction.nonce: " + transaction.nonce);
      return transaction;
    });
  }

  protected watchNonce(): Observable<number> {
    return interval(800).pipe(
      switchMap(() => defer(() => this.getTransactionCount())),
      distinctUntilChanged(),
      share()
    );
  }

  protected sendFallBackTransaction(nonce: number) {
    defer(() =>
      super.sendTransaction({
        ...this.EMPTY_TRANSACTION,
        nonce
      })
    )
      .pipe(
        retryBackoff({
          initialInterval: 100,
          maxRetries: 3,
          // do not retry nonce expired
          shouldRetry: err => err.code !== NONCE_EXPIRED
        }),
        switchMap(this.watchTransactionReceipt),
        take(1)
      )
      .subscribe(
        () => {
          console.log(`Sent empty transaction for nonce ${nonce}`);
        },
        err => {
          if (err.code !== NONCE_EXPIRED) {
            console.error(
              `Error sending empty transaction for nonce ${nonce} resetting state`
            );
            // could not reset the nonce, need to reset the whole state
            this.initialize();
          }
        }
      );
  }

  protected sendTransactionObservable(
    transaction: TransactionRequest
  ): Observable<TransactionResponse> {
    return defer(() => {
      // console.log("sending transaction with nonce", transaction.nonce);
      return super.sendTransaction(transaction);
    });
  }

  protected watchTransactionReceipt(transactionResponse: TransactionResponse) {
    return this.nonceChange$.pipe(
      filter(currentNonce => currentNonce > transactionResponse.nonce),
      // grab the transaction receipt
      switchMap(() =>
        defer(() => {
          return this.provider.getTransactionReceipt(transactionResponse.hash!);
        }).pipe(
          map(receipt => {
            if (!receipt) {
              throw Error("No Receipt");
            }
            return receipt;
          }),
          retryBackoff({ initialInterval: 200, maxRetries: 3 })
        )
      ),
      catchError(e => {
        console.error(
          `Error getting Transaction Receipt ${transactionResponse.hash}`
        );
        throw e;
      })
    );
  }

  protected sendTransactionFlow(
    transaction: TransactionRequest
  ): Observable<TransactionResponse> {
    return this.assignNonce(transaction).pipe(
      switchMap(this.sendTransactionObservable),
      catchError(err => {
        // if we run into a nonce too low error, send the transaction back into the queue - the nonce will get auto incremented
        if (err.code === NONCE_EXPIRED) {
          console.log("expired nonce", transaction.nonce);
          return this.sendTransactionFlow(transaction);
        }
        // if there is any kind of error, replace the transaction with an empty transaction
        this.sendFallBackTransaction(transaction.nonce as number);
        throw err;
      })
    );
  }

  async sendTransaction(
    transaction: TransactionRequest
  ): Promise<TransactionResponse> {
    return this.sendTransactionFlow(transaction)
      .pipe(
        // if the first send transaction succeeds proceed with the flow
        switchMap(transactionResponse => {
          return merge(
            this.watchTransactionReceipt(transactionResponse).pipe(
              mapTo(transactionResponse),
              timeout(this.timeoutMs)
            )
          ).pipe(
            take(1),
            catchError(err => {
              console.error(err);
              console.error(
                `Watching receipt failed, nonce: ${transactionResponse.nonce}, txHash: ${transactionResponse.hash}`
              );
              this.initialize();
              return EMPTY;
            })
          );
        }),
        // as soon as a reset event happens, drop everything else
        takeUntil(this.reset$)
      )
      .toPromise()
      .then(response => {
        // if the takeUntil fires, the promise will resolve with no response
        if (!response) {
          throw new Error("transaction reset");
        }
        return response;
      });
  }
}
