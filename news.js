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
    idx: {
      type: String,
      required: true
    },
    img_url: {
      type: String,
      required: true
    }
  },
  template: `
  <b-card no-body>
    <b-card-header header-tag="header" role="tab">
      <b-button block @click="show = !show" variant="outline-dark">{{ headline }}</b-button>
    </b-card-header>
    <b-collapse v-model="show" accordion="my-accordion" role="tabpanel">
      <b-card-body>
        <img v-if="img_url.length" src="img_url" class="mx-auto"></img>
        <b-card-text>{{ content }}</b-card-text>
      </b-card-body>
    </b-collapse>
  </b-card>
  `,
  data() {
    return {
      show: false
    }
  }
});

Vue.component('ankoor-news',{
  template: `
  <b-container class="m-1 p-1">
    <b-button class="m-1 p-1" @click="get_news"><b-icon-arrow-clockwise></b-icon-arrow-clockwise> Get </b-button>
    <b-tabs>
      <b-tab title="Global News">
        <div id="news_list" role="tablist">
          <news-item idx=0 v-if="news.length > 0" :img_url="news_img[0]" :content="news_content[0]" :headline="news_head[0]"></news-item>
          <news-item idx=1 v-if="news.length > 1" :img_url="news_img[1]" :content="news_content[1]" :headline="news_head[1]"></news-item>
          <news-item idx=2 v-if="news.length > 2" :img_url="news_img[2]" :content="news_content[2]" :headline="news_head[2]"></news-item>
          <news-item idx=3 v-if="news.length > 3" :img_url="news_img[3]" :content="news_content[3]" :headline="news_head[3]"></news-item>
          <news-item idx=4 v-if="news.length > 4" :img_url="news_img[4]" :content="news_content[4]" :headline="news_head[4]"></news-item>
          <news-item idx=5 v-if="news.length > 5" :img_url="news_img[5]" :content="news_content[5]" :headline="news_head[5]"></news-item>
          <news-item idx=6 v-if="news.length > 6" :img_url="news_img[6]" :content="news_content[6]" :headline="news_head[6]"></news-item>
          <news-item idx=7 v-if="news.length > 7" :img_url="news_img[7]" :content="news_content[7]" :headline="news_head[7]"></news-item>
          <news-item idx=8 v-if="news.length > 8" :img_url="news_img[8]" :content="news_content[8]" :headline="news_head[8]"></news-item>
          <news-item idx=9 v-if="news.length > 9" :img_url="news_img[9]" :content="news_content[9]" :headline="news_head[9]"></news-item>
          <news-item idx=10 v-if="news.length > 10" :img_url="news_img[10]" :content="news_content[10]" :headline="news_head[10]"></news-item>
          <news-item idx=11 v-if="news.length > 11" :img_url="news_img[11]" :content="news_content[11]" :headline="news_head[11]"></news-item>
          <news-item idx=12 v-if="news.length > 12" :img_url="news_img[12]" :content="news_content[12]" :headline="news_head[12]"></news-item>
          <news-item idx=13 v-if="news.length > 13" :img_url="news_img[13]" :content="news_content[13]" :headline="news_head[13]"></news-item>
          <news-item idx=14 v-if="news.length > 14" :img_url="news_img[14]" :content="news_content[14]" :headline="news_head[14]"></news-item>
        </div>
      </b-tab>
      <b-tab title="South Asia">
        <div id="sa_news_list" role="tablist">
          <news-item idx=15 v-if="sa_news.length > 0" img_url="" :content="sa_news_content[0]" :headline="sa_news_head[0]"></news-item>
          <news-item idx=16 v-if="sa_news.length > 1" img_url="" :content="sa_news_content[1]" :headline="sa_news_head[1]"></news-item>
          <news-item idx=17 v-if="sa_news.length > 2" img_url="" :content="sa_news_content[2]" :headline="sa_news_head[2]"></news-item>
          <news-item idx=18 v-if="sa_news.length > 3" img_url="" :content="sa_news_content[3]" :headline="sa_news_head[3]"></news-item>
          <news-item idx=19 v-if="sa_news.length > 4" img_url="" :content="sa_news_content[4]" :headline="sa_news_head[4]"></news-item>
          <news-item idx=20 v-if="sa_news.length > 5" img_url="" :content="sa_news_content[5]" :headline="sa_news_head[5]"></news-item>
          <news-item idx=21 v-if="sa_news.length > 6" img_url="" :content="sa_news_content[6]" :headline="sa_news_head[6]"></news-item>
          <news-item idx=22 v-if="sa_news.length > 7" img_url="" :content="sa_news_content[7]" :headline="sa_news_head[7]"></news-item>
          <news-item idx=23 v-if="sa_news.length > 8" img_url="" :content="sa_news_content[8]" :headline="sa_news_head[8]"></news-item>
          <news-item idx=24 v-if="sa_news.length > 9" img_url="" :content="sa_news_content[9]" :headline="sa_news_head[9]"></news-item>
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
      news_img: [],
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
        self.update_news(response);
      });
      $.ajax(sa_settings).done(function (response) {
        self.update_sa_news(response);
      });
    },
    update_news(response) {
      this.news = JSON.parse(response);
      for(var i = 0; i < this.news.length; i++) {
        console.log(this.news[i])
        Vue.set(this.news_content, i, this.news[i].content);
        Vue.set(this.news_head, i, this.news[i].title);
        Vue.set(this.news_img, i, this.news[i].img);
      }
    },
    update_sa_news(response) {
      this.sa_news = response;
      for(var i = 0; i < this.sa_news.length; i++) {
        console.log(this.sa_news[i])
        var rendered = this.sa_news[i].content.rendered.replace(/(<p style="text-align:justify">)/g, "");
        console.log(rendered);
        rendered = rendered.replace("</p>","");
        console.log(rendered);
        Vue.set(this.sa_news_content, i, rendered);
        Vue.set(this.sa_news_head, i, this.sa_news[i].title.rendered);
      }
    }
  }
});
