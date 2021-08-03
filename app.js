var encrypted_js = {};
$.getJSON("./test.json", function(json) {encrypted_js = json});

var app = new Vue({
  el: '#app',
  template: `
  <b-container style="background-color:#E0FFF2">
    <b-row class="m-1 p-1">
      <b-col align="center">
        <img style="max-height:100px" src="./ankoor.png">
        <br>
        <p style="font-weight: bold; font-size:26px" class="mt-2 mb-1"> ankoor </p>
        <b-row class="m-0"><b-col align="center">
          <a target="_blank" href="https://www.instagram.com/ankoorsmusic/" class="fa fa-2x fa-instagram m-2" style="text-decoration:none"></a>
          <a target="_blank" href="https://twitter.com/ankoorsmusic" class="fa fa-2x fa-twitter m-2" style="text-decoration:none"></a>
          <a target="_blank" href="https://www.youtube.com/channel/UC0iiGmxfRqd_fUZWUbRjNWw" class="fa fa-2x fa-youtube m-2" style="text-decoration:none"></a>
          <a target="_blank" href="mailto:encore.apte@gmail.com" class="fa fa-2x fa-envelope m-2" style="text-decoration:none"></a>
        </b-col></b-row>
        <p>my first EP out on 8/6!</p>
        <img style="max-height:300px" src="./spellbound_date.jpeg">
        <b-row v-if="false">
          <b-col>
            <b-input-group>
              <b-form-input v-model="password"></b-form-input>
              <b-input-group-append>
                <b-button @click="unlock" variant="info">Unlock</b-button>
              </b-input-group-append>
            </b-input-group>
            <div v-if="unlocked">
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
      unlocked: false,
      menu: 0,
    }
  },
  methods: {
    unlock() {
      try {
        var code = CryptoJS.AES.decrypt(encrypted_js.value, this.password);
        var decryptedMessage = code.toString(CryptoJS.enc.Utf8);
        var script = "<script type='text/javascript'> " + decryptedMessage + " </script>";
        $('body').append(script);
        this.unlocked = true;
      } catch(e) {
        throw new Error(e);
      }
    }
  }
})
