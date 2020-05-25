var encrypted_js = {};
$.getJSON("./test.json", function(json) {encrypted_js = json});

var app = new Vue({
  el: '#app',
  template: `
  <b-container>
    <b-row>
      <b-col>
        <b-button variant="outline-dark" v-b-toggle.sidebar-1><b-icon-list></b-icon-list> Ankoor </b-button>
        <b-sidebar id="sidebar-1" title="Menu" shadow backdrop-variant="dark" backdrop>
          <b-list-group flush>
            <b-list-group-item href="#" @click="menu = 1">me</b-list-group-item>
            <b-list-group-item href="#" @click="menu = 2">resumé</b-list-group-item>
            <b-list-group-item href="#" @click="menu = 3">news</b-list-group-item>
            <b-list-group-item href="#" @click="menu = 4">my stuff</b-list-group-item>
          </b-list-group>
        </b-sidebar>
        <b-collapse v-model="menu == 4">
          <b-input-group>
            <b-form-input v-model="password"></b-form-input>
            <b-input-group-append>
              <b-button @click="unlock" variant="info">Unlock</b-button>
            </b-input-group-append>
          </b-input-group>
          <b-row v-if="auth">
            <test-component></test-component>
          </b-row>
        </b-collapse>
      </b-col>
    </b-row>
  </b-container>
  `,
  data() {
    return {
      password: '',
      auth: false,
      menu: 0,
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
