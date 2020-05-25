var encrypted_js = {};
$.getJSON("./test.json", function(json) {encrypted_js = json});

var app = new Vue({
  el: '#app',
  template: `
  <b-container>
    <b-row>
      <b-button @click="unlock">Unlock</b-button>
    </b-row>
  </b-container>
  `,
  data() {
    return {
      password: '',

    }
  },
  methods: {
    unlock() {
      var code = CryptoJS.AES.decrypt(encrypted_js, "ankoor");
      var decryptedMessage = code.toString(CryptoJS.enc.Utf8);
      var script = "<script type='text/javascript'> " + decryptedMessage + " </script>";
      $('body').append(script);
    }
  }
})
