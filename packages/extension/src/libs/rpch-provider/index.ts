/* eslint-disable */
import RPChSDK, { type Ops } from "@rpch/sdk";
import { AbstractProvider } from "web3-eth/node_modules/web3-core"; // Import from web3-eth dependencies as web3-core uses other version
import { v4 as uuidv4 } from "uuid";

export const getSupportedRpchProvider = (
  rpcUrl: string
): string | RPChProvider => {
  if (/^ws(s)?:\/\//i.test(rpcUrl)) {
    return rpcUrl;
  }
  return new RPChProvider(rpcUrl);
};

const RPCH_SECRET_TOKEN = process.env.VUE_APP_RPCH_SECRET_TOKEN;
const DISCOVERY_PLATFORM_API_ENDPOINT = process.env.VUE_APP_DISCOVERY_PLATFORM_API_ENDPOINT;
const FORCE_ZERO_HOP = true; // TODO: Change to false after integration for better privacy

if (!RPCH_SECRET_TOKEN) {
  throw new Error("MISSING RPCH SECRET TOKEN");
}

const ops: Ops = {
  discoveryPlatformEndpoint: DISCOVERY_PLATFORM_API_ENDPOINT || undefined,
  forceZeroHop: FORCE_ZERO_HOP,
};

class RPChSDKSingleton {
  static sdk: RPChSDK | undefined;

  static options = ops;

  static send(
    ...args: Parameters<RPChSDK["send"]>
  ): ReturnType<RPChSDK["send"]> {
    if (!this.sdk) {
      // TODO: Remove after confirmation and testing
      console.info("RPCh: Client ID ", RPCH_SECRET_TOKEN);

      if (!RPCH_SECRET_TOKEN) {
        console.error("MISSING RPCH SECRET TOKEN");
        throw new Error("MISSING RPCH SECRET TOKEN");
      }

      console.info("RPCh: first SEND request, creating SDK instance");
      this.sdk = new RPChSDK(
        RPCH_SECRET_TOKEN, 
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

    if(!payload.id) {
      payload.id = uuidv4();
    }
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
