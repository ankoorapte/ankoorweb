var app = new Vue({
  el: '#app',
  template: `
  <b-container style="background-color:#E0FFF2">
    <b-row class="m-1 p-1">
      <b-col align="center">
        <b-form-file v-model="file2" class="mt-3" plain></b-form-file>
        <div class="mt-3">Selected file: {{ file ? file.name : '' }}</div>
      </b-col>
    </b-row>
  </b-container>
  `,
  data() {
    return {
      file: null
    }
  }
})
