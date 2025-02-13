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
}

export function getTrustLevel(rate: number): TrustLevel {
  switch (true) {
    case rate >= 80:
      return TrustLevel.VERY_HIGH;
    case rate >= 60:
      return TrustLevel.HIGH;
    case rate >= 40:
      return TrustLevel.LOW;
    case rate >= 20:
      return TrustLevel.VERY_LOW;
    case rate >= 0:
      return TrustLevel.STRONGLY_LOW;
  }

  throw new Error(`Rate not valid: ${rate}`);
}

export function getTrustLevelSpec(trustLevel: TrustLevel): TrustLevelSpec {
  switch (trustLevel) {
    case TrustLevel.VERY_HIGH:
      return { text: "very high", color: "#004526", class: "success-dark" };
    case TrustLevel.HIGH:
      return { text: "high", color: "#28c76f", class: "success" };
    case TrustLevel.LOW:
      return { text: "low", color: "#ff9f43", class: "warning" };
    case TrustLevel.VERY_LOW:
      return { text: "very low", color: "#ff9e4eb3", class: "warning-dark" };
    case TrustLevel.STRONGLY_LOW:
      return { text: "strongly low", color: "#ea5455", class: "danger" };
    case TrustLevel.NOT_LOADED:
      return { text: "not loaded", color: "#fff", class: "" };
  }
}
