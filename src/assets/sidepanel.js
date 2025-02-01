document.addEventListener("alpine:init", () => {
  Alpine.data("spm", () => {
    return {
      dbName: "juasnpk",
      dbConnection: null,
      spm_pwlist_html: "",
      isModalOpen: false,
      showValidation: false,
      showSuccess: false,

      // entry point
      init() {
        this.initApp();
      },
      // initialize app and  create a db connection
      initApp() {
        const dbName = this.dbName;
        const request = indexedDB.open(dbName, 1);
        request.onerror = (event) => {
          console.error(event.target.result);
        };
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          const objectStore = db.createObjectStore("pwlist", { keyPath: "id", autoIncrement:true });

          // Create an index to search record by name. We may have duplicates
          // so we can't use a unique index.
          objectStore.createIndex("name", "name", { unique: false });

          // Use transaction oncomplete to make sure the objectStore creation is
          // finished before adding data into it.
          objectStore.transaction.oncomplete = (event) => {
            console.log("DB created successfully");
          };
        };
        request.onsuccess = (event) => {
          db = event.target.result;
          this.dbConnection = db;
          console.log(this.dbConnection);
          console.log("Fetching all data from DB and render");
          this.initAppData();
        };
      },
      // fetch data from indexeddb and render HTML
      initAppData() {
        let self = this;
        self.spm_pwlist_html = "";
        const pwListStore = self.dbConnection
          .transaction("pwlist", "readwrite")
          .objectStore("pwlist");
        pwListStore.getAll().onsuccess = (event) => {
          let pwList = event.target.result.reverse();
          pwList.forEach((record) => {
            self.spm_pwlist_html += self.renderRecord(record);
          });
        };
      },
      // generate HTML for password DB
      renderRecord(record) {
        let urlHtml = '';
        if (record.url === undefined || record.url === null || record.url === '') {
          urlHtml = `<span>${record.name}</span>`;
        } else {
          urlHtml = `<a href="${record.url}" target="_blank">${record.name}</a>`;
        }
        return `
        <tr spwid="${record.id}">
          <th scope="row">${urlHtml}</th>
          <td title="Click To Copy" x-on:click="copytoclipboard" spwdata="${record.user}">${record.user}</td>
          <td title="Click To Copy" x-on:click="copytoclipboard" spwdata="${record.password}">${record.password}</td>
        </tr>
        `;
      },
      // add new record
      addNew(e) {
        let self = this;
        if (!self.validateForm()) {
          return;
        }

        const pwListStore = self.dbConnection
          .transaction("pwlist", "readwrite")
          .objectStore("pwlist");
        let data = {
          name: document.getElementById('name').value,
          user: document.getElementById('user').value,
          password: document.getElementById('password').value,
          url: document.getElementById('url').value,
        };
        let addRequest = pwListStore.add(data);
        addRequest.onsuccess = function(event) {
          self.showSuccess = true;
          self.emptyForm();
          self.initAppData();
        };
      },
      // validate form
      validateForm() {
        this.showValidation = false;
        this.showSuccess = false;
        const isEmpty = str => !str.trim().length;
        let name = document.getElementById('name');
        let user = document.getElementById('user');
        let password = document.getElementById('password');

        if (isEmpty(name.value) || isEmpty(user.value) || isEmpty(password.value)) {
          this.showValidation = true;
          return false;
        }

        this.showValidation = false;
        return true;
      },
      // empty form
      emptyForm() {
        document.getElementById('name').value = '';
        document.getElementById('user').value = '';
        document.getElementById('password').value = '';
        document.getElementById('url').value = '';
      },
      // show modal
      showModal(e) {
        this.showValidation = false;
        this.showSuccess = false;
        this.isModalOpen = true;
      },
      // hide modal
      hideModal(e) {
        this.showValidation = false;
        this.showSuccess = false;
        this.isModalOpen = false;
      },
      // copy to clipboard
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
