var encrypted_js = {};
$.getJSON("./test.json", function(json) {encrypted_js = json});

var app = new Vue({
  el: '#app',
  template: `
  <b-container class="m-1 p-1">
    <b-row>
      <b-col>
        <b-button class="m-1 p-1" variant="outline-dark" v-b-toggle.sidebar-1><b-icon-list></b-icon-list> Ankoor </b-button>
        <b-sidebar id="sidebar-1" title="Things" shadow backdrop-variant="dark" backdrop>
          <b-list-group flush>
            <b-list-group-item href="#" @click="menu = 1">me</b-list-group-item>
            <b-list-group-item href="#" @click="menu = 2">resumé</b-list-group-item>
            <b-list-group-item href="#" @click="menu = 3">news</b-list-group-item>
            <b-list-group-item href="#" @click="menu = 4">my stuff</b-list-group-item>
          </b-list-group>
        </b-sidebar>
        <b-row v-if="menu == 4">
          <b-col>
            <b-input-group>
              <b-form-input v-model="password"></b-form-input>
              <b-input-group-append>
                <b-button @click="unlock" variant="info">Unlock</b-button>
              </b-input-group-append>
            </b-input-group>
            <div v-if="auth">
              <test-component></test-component>
            </div>
          </b-col>
        </b-row>
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
