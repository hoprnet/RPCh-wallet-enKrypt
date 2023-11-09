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

export class RPChProvider implements AbstractProvider {
  sdk: RPChSDK;

  constructor(rpcUrl: string) {
    const ops: Ops = {
      discoveryPlatformEndpoint:
        process.env.VUE_APP_DISCOVERY_PLATFORM_API_ENDPOINT || undefined,
      provider: rpcUrl,
    };

    // TODO: Remove after confirmation and testing
    console.log("RPCh: CREATING SDK INSTANCE with OPS ", ops);
    console.log("RPCh: Client ID ", process.env.VUE_APP_RPCH_SECRET_TOKEN);

    if (!process.env.VUE_APP_RPCH_SECRET_TOKEN) {
      throw new Error("MISSING RPCH SECRET TOKEN");
    }

    this.sdk = new RPChSDK(process.env.VUE_APP_RPCH_SECRET_TOKEN, ops);
  }

  sendAsync(
    payload: Parameters<AbstractProvider["sendAsync"]>[0],
    callback: Parameters<AbstractProvider["sendAsync"]>[1]
  ) {
    this.sdk
      .send({
        ...payload,
        jsonrpc: "2.0",
      })
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
