import { Analysis } from "@/utils/analysis";
import { getTrustLevel, getTrustLevelSpec } from "@/utils/trust-level";
import { useState } from "react";
import "./App.css";
import Chart from "./Chart";
import logo from "/logo-dark.svg";

function App() {
  const [trust, setTrust] = useState({ text: "", color: "", class: "" });
  const [analysis, setAnalysis] = useState(Analysis.build("", -1, "", false));
  const [loading, setLoading] = useState(true);

  function updateRate(analysis: Analysis) {
    setLoading(false);
    setAnalysis(analysis);
    setTrust(getTrustLevelSpec(getTrustLevel(analysis.rate)));
  }

  function handleTrustChange(event: React.ChangeEvent<HTMLInputElement>) {
    analysis.isTrusted = event.target.checked;
    analysis.store();
    setAnalysis(analysis);
  }

  getCurrentTab().then((tab) => {
    const url = getTabUrl(tab);

    if (url == undefined) return;

    Analysis.load(url.host)
      .then((analysis) => updateRate(analysis))
      .catch(() => {});
  });

  return (
    <>
      <div>
        <a href="https://scamminder.com/" target="_blank">
          <img src={logo} className="logo" alt="ScamMinder" />
        </a>
      </div>
      {!loading && (
        <div className="card">
          <Chart rate={analysis.rate} className={trust.class} />
          <span className={"capitalize badge " + trust.class}>
            {trust.text} (
            <a href={analysis.path} target="_blank">
              Detail
            </a>
            )
          </span>
        </div>
      )}
      <div>
        <button
          className="danger"
          onClick={() => chrome.runtime.sendMessage({ action: "openAssist" })}
        >
          Are you scammed?
        </button>
      </div>
      <p className="read-the-docs">
        <a href="https://scamminder.com/faq/" target="_blank">
          FAQ
        </a>
        <span> | </span>
        <span>
          © {new Date().getFullYear()} ScamMinder . All rights reserved.
        </span>
      </p>
      {analysis.rate >= 0 && analysis.rate <= 60 && (
        <p className="self-trust">
          <label>
            <input
              type="checkbox"
              checked={analysis.isTrusted}
              onChange={handleTrustChange}
            />
            I trust <span>{analysis.host}</span>, don't warn me.
          </label>
        </p>
      )}
    </>
  );
}

export default App;
