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

if (!process.env.VUE_APP_RPCH_SECRET_TOKEN) {
  throw new Error("MISSING RPCH SECRET TOKEN");
}

const ops: Ops = {
  discoveryPlatformEndpoint:
    process.env.VUE_APP_DISCOVERY_PLATFORM_API_ENDPOINT || undefined,
};
const sdk = new RPChSDK(process.env.VUE_APP_RPCH_SECRET_TOKEN, ops);

export class RPChProvider implements AbstractProvider {
  provider: string;

  constructor(rpcUrl: string) {
    this.provider = rpcUrl;
  }

  sendAsync(
    payload: Parameters<AbstractProvider["sendAsync"]>[0],
    callback: Parameters<AbstractProvider["sendAsync"]>[1]
  ) {
    sdk
      .send(
        {
          ...payload,
          jsonrpc: "2.0",
        },
        { provider: this.provider }
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
