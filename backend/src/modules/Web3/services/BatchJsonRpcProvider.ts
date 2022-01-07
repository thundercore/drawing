import { catchError, filter, map, mergeMap, share, take } from "rxjs/operators";
import {
  defer,
  EMPTY,
  from,
  interval,
  Observable,
  of,
  Subscription
} from "rxjs";
import { JsonRpcProvider } from "ethers/providers/json-rpc-provider";
import { ConnectionInfo, fetchJson } from "ethers/utils/web";
import { Networkish } from "ethers/utils";
import { getBatchRpcResults, getJsonRpcResult } from "../utils/utils";
import { OnModuleDestroy, OnModuleInit } from "@nestjs/common";

const MaxContentLength = 131072;

export class BatchJsonRpcProvider extends JsonRpcProvider
  implements OnModuleDestroy, OnModuleInit {
  private currentBatch: any[] = [];
  private batchProcess: Observable<any>;
  private id = 1;
  private subscription: Subscription;
  constructor(
    private batchInterval: number = 100,
    url?: ConnectionInfo | string,
    network?: Networkish
  ) {
    super(url, network);
    this.batchProcess = this.runBatch();
  }

  onModuleInit = () => {
    this.subscription = this.batchProcess.subscribe();
  };

  onModuleDestroy = () => {
    this.subscription.unsubscribe();
  };

  runBatch = () => {
    return interval(this.batchInterval).pipe(
      mergeMap(() => {
        if (!this.currentBatch.length) {
          return EMPTY;
        }
        const batches = this.currentBatch.splice(0, 20).reduce(
          (acc, value) => {
            const workingBatch = acc[acc.length - 1];
            if (
              JSON.stringify(value).length +
                JSON.stringify(workingBatch).length +
                1 <
              MaxContentLength
            ) {
              workingBatch.push(value);
            } else {
              acc.push([value]);
            }
            return acc;
          },
          [[]] as any[][]
        );
        // console.log(
        //   `[BatchJsonRpcProvider] ======= remaining currentBatch size: ${this.currentBatch.length} =======`
        // );
        return from(batches);
      }),
      mergeMap((batch: any) => {
        // console.log(
        //   `[BatchJsonRpcProvider] batch size: ${batch.length}, batch length: ${
        //     JSON.stringify(batch).length
        //   }`
        // );
        return defer(() =>
          fetchJson(this.connection, JSON.stringify(batch), getBatchRpcResults)
        ).pipe(
          catchError(() => {
            return of(
              batch.map(item => ({
                id: item.id,
                error: { message: "rpc-error" }
              }))
            );
          })
        );
      }),
      share()
    );
  };

  handleBatchableRequest = (request: any) => {
    this.currentBatch.push(request);
    return this.batchProcess
      .pipe(
        map(batch => batch[request.id]),
        filter(val => !!val),
        map(getJsonRpcResult),
        take(1)
      )
      .toPromise();
  };

  send = (method: string, params: any): Promise<any> => {
    if (method != "eth_sendRawTransaction") {
      // NOTE: assume super.send assigns a random `id` to RPC request
      return super.send(method, params);
    }

    const request = {
      method,
      params,
      id: this.id,
      jsonrpc: "2.0"
    };
    this.id++;
    return this.handleBatchableRequest(request);
  };
}
