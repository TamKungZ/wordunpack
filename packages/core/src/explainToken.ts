import type {
  ExplainedToken,
  TokenGloss,
  TokenizedToken,
} from "./types.js";

export function explainToken(args: {
  token: TokenizedToken;
  staticGloss: Partial<ExplainedToken> | undefined;
  translatedGloss: TokenGloss | undefined;
  staticProviderName: string | undefined;
  tokenProviderName: string | undefined;
}): ExplainedToken {
  const direct = args.translatedGloss?.direct ?? args.staticGloss?.direct;
  const role = args.staticGloss?.role ?? args.translatedGloss?.role;
  const note = args.staticGloss?.note ?? args.translatedGloss?.note;
  const confidence =
    args.translatedGloss?.confidence ?? args.staticGloss?.confidence;
  const sourceProvider = args.translatedGloss
    ? args.translatedGloss.sourceProvider ?? args.tokenProviderName
    : args.staticGloss
      ? args.staticGloss.sourceProvider ?? args.staticProviderName
      : undefined;

  return {
    ...args.token,
    direct: direct ?? args.token.surface,
    role: role ?? fallbackRole(args.token),
    note,
    confidence,
    sourceProvider,
  };
}

function fallbackRole(token: TokenizedToken): string {
  if (token.kind === "punctuation") {
    return "punctuation";
  }

  return token.partOfSpeech ?? "unknown";
}
