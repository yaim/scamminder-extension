const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getAnalysis(
  host: string
): Promise<{ path: string; rate: number }> {
  await updateCookies();

  return await checkWebsite(host).then(({ redirectTo, checkId }) => {
    if (redirectTo) {
      return fetchRateData(redirectTo);
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

async function fetchRateData(analysisUrl: string) {
  const response = await fetch(analysisUrl);
  if (response.status === 404) return { path: analysisUrl, rate: -1 };
  if (!response.ok) throw new Error(`Response status: ${response.status}`);

  const text = await response.text();
  return { path: analysisUrl, rate: parseRate(text) };
}

function parseRate(htmlText: string): number {
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
  return result.rate_score;
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
