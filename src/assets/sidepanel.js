document.addEventListener("alpine:init", () => {
  Alpine.data("spm", () => {
    return {
      spm_pwlist_html: "",
      init() {
        fetch(chrome.runtime.getURL("./../data/password.json"))
          .then((response) => response.json())
          .then((data) => {
            console.log(data);
            data.forEach((record) => {
              this.spm_pwlist_html += `
              <tr>
                <th scope="row"><a href="${record.url}" target="_blank">${record.instance}</a></th>
                <td title="Click To Copy" x-on:click="copytoclipboard" spwdata="${record.user}">${record.user}</td>
                <td title="Click To Copy" x-on:click="copytoclipboard" spwdata="${record.password}">${record.password}</td>
              </tr>
              `;
            });
          })
          .catch((error) => {
            console.error("Error:", error);
          });
      },
      copytoclipboard(e) {
        console.log(e.target.getAttribute("spwdata"));
        var text = e.target.getAttribute("spwdata");
        navigator.clipboard.writeText(text).then(
          function () {
            console.log("Async: Copying to clipboard was successful!");
          },
          function (err) {
            console.error("Async: Could not copy text: ", err);
          },
        );
      },
    };
  });
});
