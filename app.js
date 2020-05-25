var encrypted_js = {};
$.getJSON("./test.json", function(json) {encrypted_js = json});

var app = new Vue({
  el: '#app',
  template: `
  <b-container>
    <b-row>
      <b-input-group prepend="Enter password" class="mt-3">
        <b-form-input v-model="password"></b-form-input>
        <b-input-group-append>
          <b-button variant="info">Unlock</b-button>
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
      var self = this;
      var code = CryptoJS.AES.decrypt(encrypted_js.value, self.password);
      var decryptedMessage = code.toString(CryptoJS.enc.Utf8);
      var script = "<script type='text/javascript'> " + decryptedMessage + " </script>";
      $('body').append(script);
      setTimeout(function() {
        self.auth = true;
      },2000)
    }
  }
})
