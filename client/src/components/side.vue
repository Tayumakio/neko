<template>
  <aside class="neko-menu" ref="menu">
    <div class="tabs-container">
      <ul>
        <li :class="{ active: tab === 'chat' }" @click.stop.prevent="change('chat')">
          <i class="fas fa-comment-alt" />
          <span>{{ $t('side.chat') }}</span>
        </li>
        <li v-if="filetransferAllowed" :class="{ active: tab === 'files' }" @click.stop.prevent="change('files')">
          <i class="fas fa-file" />
          <span>{{ $t('side.files') }}</span>
        </li>
        <li :class="{ active: tab === 'settings' }" @click.stop.prevent="change('settings')">
          <i class="fas fa-sliders-h" />
          <span>{{ $t('side.settings') }}</span>
        </li>
      </ul>
    </div>
    <div class="page-container">
      <neko-chat v-if="tab === 'chat'" />
      <neko-files v-if="tab === 'files'" />
      <neko-settings v-if="tab === 'settings'" />
    </div>
  </aside>
</template>

<style lang="scss">
  .neko-menu {
    width: $side-width;
    background-color: $background-primary;
    flex-shrink: 0;
    max-height: 100%;
    max-width: 100%;
    display: flex;
    flex-direction: column;

    .tabs-container {
      background: $background-tertiary;
      height: $menu-height;
      max-height: 100%;
      max-width: 100%;
      display: flex;
      flex-shrink: 0;

      ul {
        display: inline-block;
        padding: 16px 0 0 0;

        li {
          background: $background-secondary;
          border-radius: 3px 3px 0 0;
          border-bottom: none;
          display: inline-block;
          padding: 5px 10px;
          margin-right: 4px;
          font-weight: 600;
          cursor: pointer;

          i {
            margin-right: 4px;
            font-size: 10px;
          }

          &.active {
            background: $background-primary;
          }
        }
      }
    }

    .page-container {
      max-height: 100%;
      flex-grow: 1;
      display: flex;
      overflow: auto;
      padding-top: 5px;
    }
  }
</style>

<script lang="ts">
  import { Vue, Component, Watch, Ref } from 'vue-property-decorator'

  import Settings from '~/components/settings.vue'
  import Chat from '~/components/chat.vue'
  import Files from '~/components/files.vue'

  @Component({
    name: 'neko',
    components: {
      'neko-settings': Settings,
      'neko-chat': Chat,
      'neko-files': Files,
    },
  })
  export default class extends Vue {
    @Ref('menu') readonly menu!: HTMLElement;
    private resizeObserver: ResizeObserver | null = null;
    private windowResizeHandler: (() => void) | null = null;

    get filetransferAllowed() {
      return (
        this.$accessor.remote.fileTransfer && (this.$accessor.user.admin || !this.$accessor.isLocked('file_transfer'))
      )
    }

    get tab() {
      return this.$accessor.client.tab
    }

    get theaterMode() {
      return this.$accessor.client.theaterMode
    }

    mounted() {
      this.setupResizeObserver();
      this.setupWindowResizeHandler();
    }

    beforeDestroy() {
      this.cleanupResizeObserver();
      this.cleanupWindowResizeHandler();
    }

    setupWindowResizeHandler() {
      if (!this.windowResizeHandler) {
        this.windowResizeHandler = () => {
          if (this.theaterMode && this.menu) {
            // Get the current width
            const currentWidth = this.menu.getBoundingClientRect().width;

            // Constrain the width to reasonable limits
            const minWidth = 250; // Minimum width in pixels
            const maxWidth = window.innerWidth * 0.5; // Maximum width is 50% of window width
            const newWidth = Math.max(minWidth, Math.min(currentWidth, maxWidth));

            // Set the width of the menu element if it needs to be constrained
            if (newWidth !== currentWidth) {
              this.menu.style.width = `${newWidth}px`;
              this.$accessor.client.setChatWidth(newWidth);
            }
          }
        };

        window.addEventListener('resize', this.windowResizeHandler);
      }
    }

    cleanupWindowResizeHandler() {
      if (this.windowResizeHandler) {
        window.removeEventListener('resize', this.windowResizeHandler);
        this.windowResizeHandler = null;
      }
    }

    @Watch('theaterMode')
    onTheaterModeChange() {
      // Re-setup the observers when theater mode changes
      this.$nextTick(() => {
        // Clean up and re-setup resize observer
        this.cleanupResizeObserver();
        this.setupResizeObserver();

        // Clean up and re-setup window resize handler
        this.cleanupWindowResizeHandler();
        this.setupWindowResizeHandler();

        // If entering theater mode, initialize the chat width
        if (this.theaterMode && this.menu) {
          // Get the stored width from the store
          const storedWidth = this.$accessor.client.chatWidth;

          // Constrain the width to reasonable limits
          const minWidth = 250; // Minimum width in pixels
          const maxWidth = window.innerWidth * 0.5; // Maximum width is 50% of window width
          const newWidth = Math.max(minWidth, Math.min(storedWidth, maxWidth));

          // Set the width of the menu element
          this.menu.style.width = `${newWidth}px`;

          // Update the store if the width was constrained
          if (newWidth !== storedWidth) {
            this.$accessor.client.setChatWidth(newWidth);
          }
        }
      });
    }

    setupResizeObserver() {
      if (!this.resizeObserver && this.menu) {
        this.resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            if (entry.target === this.menu && this.theaterMode) {
              // Constrain the width to reasonable limits
              const minWidth = 250; // Minimum width in pixels
              const maxWidth = window.innerWidth * 0.5; // Maximum width is 50% of window width
              const newWidth = Math.max(minWidth, Math.min(entry.contentRect.width, maxWidth));

              // Update the chat width in the store
              this.$accessor.client.setChatWidth(newWidth);

              // If the width was constrained, update the element's width
              if (newWidth !== entry.contentRect.width) {
                this.menu.style.width = `${newWidth}px`;
              }
            }
          }
        });
        this.resizeObserver.observe(this.menu);
      }
    }

    cleanupResizeObserver() {
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
      }
    }

    @Watch('tab', { immediate: true })
    @Watch('filetransferAllowed', { immediate: true })
    onTabChange() {
      // do not show the files tab if file transfer is disabled
      if (this.tab === 'files' && !this.filetransferAllowed) {
        this.change('chat')
      }
    }

    @Watch('filetransferAllowed')
    onFileTransferAllowedChange() {
      if (this.filetransferAllowed) {
        this.$accessor.files.refresh()
      }
    }

    change(tab: string) {
      this.$accessor.client.setTab(tab)
    }
  }
</script>
