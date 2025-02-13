export default defineContentScript({
  matches: ["https://scamminder.com/#open-assist"],
  main() {
    window.addEventListener("load", () => {
      const button = getAssistButton();

      if (button) {
        button.click();
      }
    });

    function getAssistButton(): HTMLButtonElement | null {
      return document.querySelector("#menu-front-head-menu button");
    }
  },
});
