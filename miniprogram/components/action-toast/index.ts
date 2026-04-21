Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    message: {
      type: String,
      value: ''
    },
    type: {
      type: String,
      value: 'info' // info | success | warning
    },
    iconType: {
      type: String,
      value: '' // success | delete | warning | 其他自定义类型
    },
    showButton: {
      type: Boolean,
      value: false
    },
    buttonText: {
      type: String,
      value: '去看看'
    },
    duration: {
      type: Number,
      value: 2000
    },
    subtitle: {
      type: String,
      value: ''
    }
  },

  data: {
    visible: false
  },

  observers: {
    'show': function(show) {
      if (show) {
        this.showToast();
      } else {
        this.hideToast();
      }
    }
  },

  methods: {
    showToast() {
      this.setData({ visible: true });

      if (this.data.duration > 0) {
        this.timer = setTimeout(() => {
          this.hideToast();
        }, this.data.duration);
      }
    },

    hideToast() {
      this.setData({ visible: false });
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
    },

    onButtonTap() {
      this.triggerEvent('buttontap');
    },

    onClose() {
      this.hideToast();
    }
  },

  lifetimes: {
    detached() {
      if (this.timer) {
        clearTimeout(this.timer);
      }
    }
  }
});