import { getTrustLevel, getTrustLevelSpec } from "@/utils/trust-level";
import { useState } from "react";
import "./App.css";
import Chart from "./Chart";
import logo from "/logo-dark.svg";

function App() {
  const [trust, setTrust] = useState({ text: "", color: "", class: "" });
  const [pathRate, setPathRate] = useState({ path: "", rate: -1 });
  const [loading, setLoading] = useState(true);

  function updateRate(pathRate: { path: string; rate: number }) {
    setLoading(false);
    setPathRate(pathRate);
    setTrust(getTrustLevelSpec(getTrustLevel(pathRate.rate)));
  }

  getCurrentTab().then((tab) => {
    const url = getTabUrl(tab);

    if (url == undefined) return;

    getFromStorage<{ path: string; rate: number }>(url.host)
      .then((rate) => updateRate(rate))
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
          <Chart rate={pathRate.rate} className={trust.class} />
          <span className={"capitalize badge " + trust.class}>
            {trust.text} (
            <a href={pathRate.path} target="_blank">
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
    </>
  );
}

export default App;
