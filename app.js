var encrypted_js = {};
$.getJSON("./test.json", function(json) {encrypted_js = json});

var app = new Vue({
  el: '#app',
  template: `
  <b-container style="background-color:#E0FFF2">
    <b-row class="m-1 p-1">
      <b-col>
        <img style="max-height:100px" src="./ankoor.png">
        <b-row><b-col>
          <a target="_blank" href="https://www.instagram.com/ankoorsmusic/" class="fa fa-2x fa-instagram mt-2 mb-2"></a>
          <a target="_blank" href="https://twitter.com/ankoorsmusic" class="fa fa-2x fa-twitter mt-2 mb-2 "></a>
          <a target="_blank" href="https://www.youtube.com/channel/UC0iiGmxfRqd_fUZWUbRjNWw" class="fa fa-2x fa-envelope mt-2 mb-2 "></a>
        </b-col></b-row>
        <p> Spellbound EP coming out on 8/6! </p>
        <img style="max-height:400px" src="./spellbound.png">
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
