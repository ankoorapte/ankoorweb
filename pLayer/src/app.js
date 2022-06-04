var app = new Vue({
  el: '#app',
  template: `
  <b-container style="background-color:#E0FFF2">
    <b-row class="m-1 p-1">
      <b-col align="center">
        <div>
          <!-- Styled -->
          <b-form-file
            v-model="file1"
            :state="Boolean(file1)"
            placeholder="Choose a file or drop it here..."
            drop-placeholder="Drop file here..."
          ></b-form-file>
          <div class="mt-3">Selected file: {{ file1 ? file1.name : '' }}</div>

          <!-- Plain mode -->
          <b-form-file v-model="file2" class="mt-3" plain></b-form-file>
          <div class="mt-3">Selected file: {{ file2 ? file2.name : '' }}</div>
        </div>
      </b-col>
    </b-row>
  </b-container>
  `,
  data() {
    return {
      file1: null,
      file2: null
    }
  }
})
