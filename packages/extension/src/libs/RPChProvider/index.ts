import RPChSDK, { type Ops } from "@rpch/sdk";
import { AbstractProvider } from "web3-eth/node_modules/web3-core"; // I had to import from web3-eth dependencies as web3-core has other version

export const getSupportedRpchProvider = (
  rpcUrl: string
): string | RPChProvider => {
  if (/^ws(s)?:\/\//i.test(rpcUrl)) {
    return rpcUrl;
  }
  return new RPChProvider(rpcUrl);
};

class RPChSDKSingleton {
  static sdk: RPChSDK | undefined;

  static options: Ops = {
    discoveryPlatformEndpoint:
      process.env.VUE_APP_DISCOVERY_PLATFORM_API_ENDPOINT || undefined,
  };

  static send(
    ...args: Parameters<RPChSDK["send"]>
  ): ReturnType<RPChSDK["send"]> {
    if (!this.sdk) {
      // TODO: Remove after confirmation and testing
      console.info("RPCh: Client ID ", process.env.VUE_APP_RPCH_SECRET_TOKEN);

      if (!process.env.VUE_APP_RPCH_SECRET_TOKEN) {
        console.error("MISSING RPCH SECRET TOKEN");
        throw new Error("MISSING RPCH SECRET TOKEN");
      }

      console.info("RPCh: first SEND request, creating SDK instance");
      this.sdk = new RPChSDK(
        process.env.VUE_APP_RPCH_SECRET_TOKEN,
        this.options
      );
    }
    return this.sdk.send(...args);
  }
}

export class RPChProvider implements AbstractProvider {
  rpcUrl: string;

  constructor(rpcUrl: string) {
    this.rpcUrl = rpcUrl;
  }

  sendAsync(
    payload: Parameters<AbstractProvider["sendAsync"]>[0],
    callback: Parameters<AbstractProvider["sendAsync"]>[1]
  ) {
    RPChSDKSingleton.send(
      {
        ...payload,
        jsonrpc: "2.0",
      },
      { provider: this.rpcUrl }
    )
      .then(async (res) => {
        const jsonRes = await res.json();
        const parsedRes = {
          ...jsonRes,
          id: jsonRes.id || 0,
        };
        callback?.(null, parsedRes);
      })
      .catch((err) => {
        callback?.(err as Error);
      });
  }
}
