const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class Analysis implements IAnalysis {
  host: string;
  rate: number;
  path: string;
  isFinal: boolean;
  isTrusted: boolean;

  constructor(analysis: IAnalysis) {
    this.host = analysis.host;
    this.rate = analysis.rate;
    this.path = analysis.path;
    this.isFinal = analysis.isFinal;
    this.isTrusted = analysis.isTrusted;
  }

  static build(host: string, rate: number, path: string, isFinal: boolean) {
    return new Analysis({
      host: host,
      rate: rate,
      path: path,
      isFinal: isFinal,
      isTrusted: false,
    });
  }

  shouldRefresh(): boolean {
    if (this.rate == undefined || this.rate == -1) return true;

    return !this.containsFinalResult();
  }

  private containsFinalResult(): boolean {
    return this.isFinal != undefined && this.isFinal == true;
  }

  toJSON(): IAnalysis {
    return {
      host: this.host,
      rate: this.rate,
      path: this.path,
      isFinal: this.isFinal,
      isTrusted: this.isTrusted,
    };
  }

  store() {
    const analysis: IStoredAnalysis = {
      ...this.toJSON(),
      storedAt: Date.now(),
    };

    const host = this.host;

    if (host == undefined) {
      throw new Error("Cannot store undefined host");
    }

    setToStorage(this.host, analysis);
  }

  static async load(host: string): Promise<Analysis> {
    if (host == undefined) {
      throw new Error("Cannot load undefined host");
    }

    const stored = await getFromStorage<IStoredAnalysis>(host);

    stored.host = stored.host || host;
    stored.isFinal = stored.isFinal || false;
    stored.isTrusted = stored.isTrusted || false;

    const analysis = new Analysis(stored);

    if (analysis.shouldRefresh() && isOlderThanAnHour(stored.storedAt)) {
      throw Error("Analysis is outdated.");
    }

    return analysis;
  }
}

interface IAnalysis {
  host: string;
  rate: number;
  path: string;
  isFinal: boolean;
  isTrusted: boolean;
}

interface IStoredAnalysis extends IAnalysis {
  storedAt: number;
}

function isOlderThanAnHour(date: number): boolean {
  return Date.now() - date > 3_600_000;
}

export async function getAnalysis(host: string): Promise<Analysis> {
  await updateCookies();

  return await checkWebsite(host).then(({ redirectTo, checkId }) => {
    if (redirectTo) {
      return fetchRateData(host, redirectTo);
    }

    if (checkId) {
      return analyzeAndGetResulst(checkId, host);
    }

    return Promise.reject();
  });
}

async function updateCookies(): Promise<void> {
  await Promise.all([
    fetch("https://scamminder.com/", {
      method: "GET",
      credentials: "include",
    }),
    fetch(
      "https://scamminder.com/include/plugins/litespeed-cache/guest.vary.php",
      {
        method: "POST",
        credentials: "include",
      }
    ),
  ]);
}

async function checkWebsite(
  host: string
): Promise<{ redirectTo?: string; checkId?: string }> {
  try {
    const response = await fetch(
      "https://scamminder.com/wp-admin/admin-ajax.php",
      {
        credentials: "include",
        headers: {
          Accept: "*/*",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: `action=scad_scheck_ajax&method=check_website&weburl=${host}`,
        method: "POST",
      }
    );

    const data = await response.json();

    if (data.redirect_to) {
      return Promise.resolve({ redirectTo: data.redirect_to });
    }

    if (data.html && data.body) {
      return Promise.resolve({ checkId: data.body });
    }

    console.warn(`Unexpected check website response for ${host}`, data);
  } catch (error) {
    console.error(`Error checking ${host}:`, error);
  }

  return Promise.reject();
}

async function fetchRateData(host: string, analysisUrl: string) {
  const analysis = Analysis.build(host, -1, analysisUrl, false);
  const response = await fetch(analysisUrl);

  if (response.status === 404) return analysis;
  if (!response.ok) throw new Error(`Response status: ${response.status}`);

  const text = await response.text();
  const result = parseResult(text);

  analysis.rate = result.rate_score;
  analysis.isFinal =
    result.update_me_title == undefined &&
    result.update_me_explain == undefined;

  return analysis;
}

function parseResult(htmlText: string): any {
  const scriptTagRegex =
    /<script[^>]*id=["']scad-app-js-extra["'][^>]*src=["']([^"']+)["'][^>]*><\/script>/g;
  const matches = Array.from(htmlText.matchAll(scriptTagRegex));
  if (matches.length === 0) {
    throw new Error("No script tags with id 'scad-app-js-extra' found.");
  }
  const lastMatch = matches[matches.length - 1];
  const srcUrl = lastMatch[1];
  if (!srcUrl.includes("base64,")) {
    throw new Error("Invalid base64 format in script src.");
  }
  const base64Content = srcUrl.split("base64,")[1];
  const decodedContent = atob(base64Content);
  const jsonString = decodedContent.split("var scad=")[1];
  const result = JSON.parse(jsonString);

  return result;
}

async function analyzeAndGetResulst(checkId: string, host: string) {
  await requestToAnalyzeAndPoll(checkId, host);

  return getAnalysis(host);
}

async function requestToAnalyzeAndPoll(checkId: string, host: string) {
  await fetch(
    `https://analyzer.scamminder.com/web/analyze.php?check_id=${checkId}&mode=bp`
  );
  return await pollAnalysisStatus(checkId, host);
}

async function pollAnalysisStatus(checkId: string, host: string) {
  for (let attempt = 1; attempt <= 30; attempt++) {
    try {
      const response = await fetch(
        `https://analyzer.scamminder.com/web/analyze.php?cid=${checkId}&mode=readstatus`
      );
      const statusData = await response.json();

      console.log(
        `Polling attempt ${attempt}: ${statusData.status} - ${statusData.message}`
      );

      if (statusData.status === "DONE") return;
      if (statusData.status !== "OK") break;
    } catch (error) {
      console.error(`Error polling analysis status for ${host}:`, error);
    }
    await delay(5000);
  }
  console.error(`Analysis polling timed out for ${host}`);
}
