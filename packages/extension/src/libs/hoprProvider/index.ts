import RPChSDK, { type Ops } from "@rpch/sdk";
import { AbstractProvider } from "web3-core";
import { Result, Error as sdkError } from "@rpch/sdk/build/jrpc";

const ops: Ops = {
  discoveryPlatformEndpoint:
    process.env.VUE_APP_DISCOVERY_PLATFORM_API_ENDPOINT || undefined,
  forceZeroHop: true,
};

// TODO: Remove after confirmation and testing
console.log("RPCh: CREATING SDK INSTANCE with OPS ", ops);
console.log("RPCh: Client ID ", process.env.VUE_APP_HOPR_CLIENT);

if (!process.env.VUE_APP_HOPR_CLIENT) {
  throw "MISSING HOPR CLIENT ID";
}

const HOPRsdk = new RPChSDK(process.env.VUE_APP_HOPR_CLIENT, ops);

export const getSuportedHoprProvider = (
  rpcUrl: string
): string | HoprProvider => {
  if (/^ws(s)?:\/\//i.test(rpcUrl)) {
    return rpcUrl;
  }
  return new HoprProvider(rpcUrl);
};

export class HoprProvider implements AbstractProvider {
  rpcUrl: string;

  constructor(rpcUrl: string) {
    this.rpcUrl = rpcUrl;
  }

  private isError(jsonRes: Result | sdkError): jsonRes is sdkError {
    return Boolean("error" in jsonRes);
  }

  sendAsync(
    payload: Parameters<AbstractProvider["sendAsync"]>[0],
    callback: Parameters<AbstractProvider["sendAsync"]>[1]
  ) {
    // TODO: Remove after confirmation and testing
    console.log("RPCh: SENDING REQUEST to: ", this.rpcUrl);
    console.log(
      "RPCh: SENDING REQUEST method: ",
      payload.method,
      " params: ",
      payload.params
    );

    HOPRsdk.send(
      {
        ...payload,
        jsonrpc: "2.0",
      },
      { provider: this.rpcUrl }
    )
      .then(async (res) => {
        const jsonRes: Result | sdkError = await res.json();
        if (this.isError(jsonRes)) {
          callback?.({ name: "", ...jsonRes.error });
          return;
        }

        const parsedRes = {
          ...jsonRes,
          id: +(jsonRes.id || 0),
        };
        callback?.(null, parsedRes);
      })
      .catch((err) => {
        callback?.(err as Error);
      });
  }
}
