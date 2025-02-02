document.addEventListener("alpine:init", () => {
  Alpine.data("spm", () => {
    return {
      dbName: "juasnpk",
      dbConnection: null,
      spm_pwlist_html: "",
      isModalOpen: false,
      showError: false,
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
        let urlHtml = `<span class="name">${record.name}</span>`;
        if (record.url !== undefined && record.url !== null && record.url !== '') {
          urlHtml = `<span class="name"><a href="${record.url}" target="_blank">${urlHtml}</a></span>`;
        }
        return `
        <div class="entry" spwid="${record.id}">
          <div class="field">
            ${urlHtml}
            <button class="edit-btn">
              <span class="material-icons" x-on:click="editEntry" data-spkdata='${JSON.stringify(record)}'>edit</span>
            </button>
            <button class="delete-btn">
              <span class="material-icons" x-on:click="deleteEntry" data-id="${record.id}">delete</span>
            </button>
          </div>
          <div class="field">
            <span>Username: ${record.user}</span>
            <button class="copy-btn">
              <span class="material-icons" x-on:click="copytoclipboard" data-spkdata="${record.user}">content_copy</span>
            </button>
          </div>
          <div class="field">
            <span>Password: ${record.password}</span>
            <button class="copy-btn">
              <span class="material-icons" x-on:click="copytoclipboard" data-spkdata="${record.password}">content_copy</span>
            </button>
          </div>
        </div>
        `;
      },
      // add new record
      saveEntry(e) {
        let self = this;
        if (!self.validateForm()) {
          return;
        }

        let data = {
          name: document.getElementById('name').value,
          user: document.getElementById('user').value,
          password: document.getElementById('password').value,
          url: document.getElementById('url').value,
        };

        let id = document.getElementById('id').value;
        if (id !== undefined && id !== null && id !== '') {
          data['id'] = parseInt(id);
        }

        const pwListStore = self.dbConnection
          .transaction("pwlist", "readwrite")
          .objectStore("pwlist");
        let addRequest = pwListStore.put(data);
        addRequest.onsuccess = function(event) {
          self.showSuccess = true;
          self.emptyForm();
          self.initAppData();
        };
      },
      // validate form
      validateForm() {
        this.showError = false;
        this.showSuccess = false;
        const isEmpty = str => !str.trim().length;
        let name = document.getElementById('name');
        let user = document.getElementById('user');
        let password = document.getElementById('password');

        if (isEmpty(name.value) || isEmpty(user.value) || isEmpty(password.value)) {
          this.showError = true;
          return false;
        }

        this.showError = false;
        return true;
      },
      // empty form
      emptyForm() {
        document.getElementById('id').value = '';
        document.getElementById('name').value = '';
        document.getElementById('user').value = '';
        document.getElementById('password').value = '';
        document.getElementById('url').value = '';
      },
      // show modal
      showModal(e) {
        this.showError = false;
        this.showSuccess = false;
        this.isModalOpen = true;
      },
      // hide modal
      hideModal(e) {
        this.showError = false;
        this.showSuccess = false;
        this.isModalOpen = false;
        this.emptyForm();
      },
      // copy to clipboard
      copytoclipboard(e) {
        const copyButton = e.target;
        var text = copyButton.getAttribute("data-spkdata");
        navigator.clipboard.writeText(text);
        copyButton.innerHTML = 'content_check';
        setTimeout(() => {
            copyButton.innerHTML = 'content_copy';
        }, 2000);
      },
      // search
      search() {
        const searchTerm = document.getElementById('search').value.toLowerCase();
        const pwListStore = this.dbConnection
          .transaction("pwlist", "readonly")
          .objectStore("pwlist");

        pwListStore.getAll().onsuccess = (event) => {
          let pwList = event.target.result.reverse();
          let filteredList = pwList.filter(record =>
            record.name.toLowerCase().includes(searchTerm) ||
            record.user.toLowerCase().includes(searchTerm) ||
            (record.url && record.url.toLowerCase().includes(searchTerm))
          );
          this.spm_pwlist_html = filteredList.map(record => this.renderRecord(record)).join('');
        };
      },
      // edit record
      editEntry(e) {
        let self = this;
        var record = JSON.parse(e.target.getAttribute("data-spkdata"));
        document.getElementById('id').value = record.id;
        document.getElementById('name').value = record.name;
        document.getElementById('user').value = record.user;
        document.getElementById('password').value = record.password;
        document.getElementById('url').value = record.url;
        self.showModal();
      },
      // delete record
      deleteEntry(e) {
        if (window.confirm("Are you sure?")) {
          let self = this;
          var id = parseInt(e.target.getAttribute("data-id"));
          const pwListStore = self.dbConnection
            .transaction("pwlist", "readwrite")
            .objectStore("pwlist");
          const deleteRequest = pwListStore.delete(id);
          deleteRequest.onsuccess = () => {
            self.initAppData(); // Refresh the list after deletion
          };
        }
      },
    };
  });
});
