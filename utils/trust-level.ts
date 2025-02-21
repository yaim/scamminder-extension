enum TrustLevel {
  VERY_HIGH,
  HIGH,
  LOW,
  VERY_LOW,
  STRONGLY_LOW,
  NOT_LOADED,
}

export interface TrustLevelSpec {
  text: string;
  color: `#${string}`;
  class: string;
  shouldWarn: boolean;
}

export function getTrustLevel(rate: number): TrustLevel {
  switch (true) {
    case rate >= 0 && rate <= 20:
      return TrustLevel.STRONGLY_LOW;
    case rate > 20 && rate <= 40:
      return TrustLevel.VERY_LOW;
    case rate > 40 && rate <= 60:
      return TrustLevel.LOW;
    case rate > 60 && rate <= 80:
      return TrustLevel.HIGH;
    case rate > 80 && rate <= 100:
      return TrustLevel.VERY_HIGH;
  }

  throw new Error(`Rate not valid: ${rate}`);
}

export function getTrustLevelSpec(trustLevel: TrustLevel): TrustLevelSpec {
  switch (trustLevel) {
    case TrustLevel.VERY_HIGH:
      return {
        text: "very high",
        color: "#004526",
        class: "success-dark",
        shouldWarn: false,
      };
    case TrustLevel.HIGH:
      return {
        text: "high",
        color: "#28c76f",
        class: "success",
        shouldWarn: false,
      };
    case TrustLevel.LOW:
      return {
        text: "low",
        color: "#ff9f43",
        class: "warning",
        shouldWarn: false,
      };
    case TrustLevel.VERY_LOW:
      return {
        text: "very low",
        color: "#ff9e4eb3",
        class: "warning-dark",
        shouldWarn: true,
      };
    case TrustLevel.STRONGLY_LOW:
      return {
        text: "strongly low",
        color: "#ea5455",
        class: "danger",
        shouldWarn: true,
      };
    case TrustLevel.NOT_LOADED:
      return {
        text: "not loaded",
        color: "#fff",
        class: "",
        shouldWarn: false,
      };
  }
}
