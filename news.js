Vue.component('news-item',{
  props: {
    headline: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
  },
  template: `
  <b-card no-body>
    <b-card-header header-tag="header" role="tab">
      <b-button block v-b-toggle.accordion-1 variant="info">{{ headline }}</b-button>
    </b-card-header>
    <b-collapse id="accordion-1" accordion="my-accordion" role="tabpanel">
      <b-card-body>
        <b-card-text>{{ content }}</b-card-text>
      </b-card-body>
    </b-collapse>
  </b-card>
  `
});

Vue.component('ankoor-news',{
  template: `
  <b-container class="m-1 p-1">
    <b-button @click="get_news"><b-icon-arrow-clockwise></b-icon-arrow-clockwise> Get </b-button>
    <b-tabs>
      <b-tab title="News">
        <div id="news_list" role="tablist">
          <news-item v-if="news.length > 0" :content="news_content[0]" :headline="news_head[0]"></news-item>
        </div>
      </b-tab>
      <b-tab title="South Asia">
        <div id="sa_news_list" role="tablist">
          <news-item v-if="sa_news.length > 0" :content="sa_news_content[0]" :headline="sa_news_head[0]"></news-item>
        </div>
      </b-tab>
    </b-tabs>
  </b-container>
  `,
  data() {
    return {
      news: [],
      sa_news: [],
      news_content: [],
      news_head: [],
      sa_news_content: [],
      sa_news_head: []
    }
  },
  methods: {
    get_news() {
      var self = this;
      var ncaf_settings = {
      	"async": true,
      	"crossDomain": true,
      	"url": "https://newscafapi.p.rapidapi.com/apirapid/news/?q=news",
      	"method": "GET",
      	"headers": {
      		"x-rapidapi-host": "newscafapi.p.rapidapi.com",
      		"x-rapidapi-key": "8447cbb122msh32c4dd4f5eca4dap1da01cjsnd1dbc1b0e977"
      	}
      }
      var sa_settings = {
      	"async": true,
      	"crossDomain": true,
      	"url": "https://the-south-asian-express-news.p.rapidapi.com/posts/",
      	"method": "GET",
      	"headers": {
      		"x-rapidapi-host": "the-south-asian-express-news.p.rapidapi.com",
      		"x-rapidapi-key": "8447cbb122msh32c4dd4f5eca4dap1da01cjsnd1dbc1b0e977"
      	}
      }
      $.ajax(ncaf_settings).done(function (response) {
      	console.log(JSON.parse(response));
        self.news = JSON.parse(response)
        self.update_news();
      });
      $.ajax(sa_settings).done(function (response) {
      	console.log(response);
        self.sa_news = response;
        self.update_sa_news();
      });
    },
    update_news() {
      for(var i = 0; i < this.news.length; i++) {
        Vue.set(this.news_content, i, '');
        Vue.set(this.news_head, i, '');
      }
    },
    update_sa_news() {
      for(var i = 0; i < this.sa_news.length; i++) {
        Vue.set(this.sa_news_content, i, '');
        Vue.set(this.sa_news_head, i, '');
      }
    }
  }
});
