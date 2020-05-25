var encrypted_js = {};
$.getJSON("./test.json", function(json) {encrypted_js = json});

var app = new Vue({
  el: '#app',
  template: `
  <b-container>
    <b-row>
      <b-button variant="outline-dark" v-b-toggle.sidebar-1><b-icon-list></b-icon-list>Menu</b-button>
      <b-sidebar id="sidebar-1" title="Ankoor" shadow>
        <p> Hello </p>
      </b-sidebar>
      <b-input-group prepend="Enter password" class="mt-3">
        <b-form-input v-model="password"></b-form-input>
        <b-input-group-append>
          <b-button @click="unlock" variant="info">Unlock</b-button>
        </b-input-group-append>
      </b-input-group>
    </b-row>
    <b-row v-if="auth">
      <test-component></test-component>
    </b-row>
  </b-container>
  `,
  data() {
    return {
      password: '',
      auth: false
    }
  },
  methods: {
    unlock() {
      try {
        var self = this;
        var code = CryptoJS.AES.decrypt(encrypted_js.value, self.password);
        var decryptedMessage = code.toString(CryptoJS.enc.Utf8);
        var script = "<script type='text/javascript'> " + decryptedMessage + " </script>";
        $('body').append(script);
        self.auth = true;
      } catch(e) {
        throw new Error(e);
      }
    }
  }
})
