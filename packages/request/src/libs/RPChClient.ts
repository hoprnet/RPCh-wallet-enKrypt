import RPChSDK, { JRPC, type Ops } from "@rpch/sdk";
import { JSONRPCParams } from "json-rpc-2.0";

class RPChSDKSingleton {
  static sdk: RPChSDK | undefined;

  static options: Ops = {
    discoveryPlatformEndpoint:
      process.env.VUE_APP_DISCOVERY_PLATFORM_API_ENDPOINT || undefined,
    forceZeroHop: true,
  };

  static send(
    ...args: Parameters<RPChSDK["send"]>
  ): ReturnType<RPChSDK["send"]> {
    if (!this.sdk) {
      // TODO: Remove after confirmation and testing
      console.log(
        "RPCh: CREATING SDK INSTANCE with OPS ",
        RPChSDKSingleton.options
      );
      console.log("RPCh: Client ID ", process.env.RPCH_SECRET_TOKEN);

      if (!process.env.RPCH_SECRET_TOKEN) {
        console.error("MISSING RPCH SECRET TOKEN");
        throw new Error("MISSING RPCH SECRET TOKEN");
      }

      console.info("RPCh: first SEND request, creating SDK instance");
      this.sdk = new RPChSDK(process.env.RPCH_SECRET_TOKEN, this.options);
    }
    return this.sdk.send(...args);
  }
}

export class RPChClient {
  rpcUrl: string;

  constructor(rpcUrl: string) {
    this.rpcUrl = rpcUrl;
  }

  request(method: string, params: JSONRPCParams): Promise<unknown> {
    // TODO: Remove after confirmation and testing
    console.log("RPCh: SENDING REQUEST to: ", this.rpcUrl);
    console.log("RPCh: SENDING REQUEST method: ", method, " params: ", params);

    return RPChSDKSingleton.send({
      jsonrpc: "2.0",
      method,
      params,
    })
      .then((res) => res.json())
      .then(({ result }: JRPC.Result) => result);
  }
}
