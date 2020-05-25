var encrypted_js = {};
$.getJSON("./test.json", function(json) {encrypted_js = json});

var app = new Vue({
  el: '#app',
  template: `
  <b-container class="m-1 p-1">
    <b-row>
      <b-col>
        <b-button class="mb-1 p-1" variant="outline-dark" v-b-toggle.sidebar-1><b-icon-list></b-icon-list> Ankoor </b-button>
        <b-sidebar id="sidebar-1" title="Things" shadow backdrop-variant="dark" backdrop>
          <b-list-group flush>
            <b-list-group-item href="#" @click="menu = 1">me</b-list-group-item>
            <b-list-group-item href="#" @click="menu = 2">calendar</b-list-group-item>
            <b-list-group-item href="#" @click="menu = 3">news</b-list-group-item>
            <b-list-group-item href="#" @click="menu = 4">my stuff</b-list-group-item>
          </b-list-group>
        </b-sidebar>
        <b-row v-if="menu == 3">
          <b-button @click="get_news">Get</b-button>
          <b-button @click="get_sa_news">Get SA</b-button>
        </b-row>
        <b-row v-if="menu == 4">
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
    get_sa_news() {
      var settings = {
      	"async": true,
      	"crossDomain": true,
      	"url": "https://the-south-asian-express-news.p.rapidapi.com/posts/",
      	"method": "GET",
      	"headers": {
      		"x-rapidapi-host": "the-south-asian-express-news.p.rapidapi.com",
      		"x-rapidapi-key": "8447cbb122msh32c4dd4f5eca4dap1da01cjsnd1dbc1b0e977"
      	}
      }

      $.ajax(settings).done(function (response) {
      	console.log(response);
      });
    },
    get_news() {
      var settings = {
      	"async": true,
      	"crossDomain": true,
      	"url": "https://newscafapi.p.rapidapi.com/apirapid/news/?q=news",
      	"method": "GET",
      	"headers": {
      		"x-rapidapi-host": "newscafapi.p.rapidapi.com",
      		"x-rapidapi-key": "8447cbb122msh32c4dd4f5eca4dap1da01cjsnd1dbc1b0e977"
      	}
      }

      $.ajax(settings).done(function (response) {
      	console.log(response);
      });
    },
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
