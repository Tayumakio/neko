<template>
  <div id="neko" :class="[!videoOnly && side ? 'expanded' : '', theaterMode ? 'theater-mode' : '']" :style="{'--chat-width': chatWidth}">
    <template v-if="!$client.supported">
      <neko-unsupported />
    </template>
    <template v-else>
      <main class="neko-main">
        <div v-if="!videoOnly" class="header-container">
          <neko-header />
        </div>
        <div class="video-container">
          <neko-video
            ref="video"
            :hideControls="hideControls"
            :extraControls="isEmbedMode"
            @control-attempt="controlAttempt"
          />
        </div>
        <div v-if="!videoOnly" class="room-container">
          <neko-members />
          <div class="room-menu">
            <div class="settings">
              <neko-menu />
            </div>
            <div class="controls">
              <neko-controls :shakeKbd="shakeKbd" />
            </div>
            <div class="emotes">
              <neko-emotes />
            </div>
            <div class="video-controls">
              <ul class="video-menu">
                <li><i @click.stop.prevent="requestFullscreen" class="fas fa-expand"></i></li>
                <li><i @click.stop.prevent="toggleTheaterMode" class="fas fa-film" v-tooltip="{ content: $t('setting.theater_mode'), placement: 'top', offset: 5, boundariesElement: 'body' }"></i></li>
                <li v-if="admin"><i @click.stop.prevent="openResolution" class="fas fa-desktop"></i></li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      <neko-side v-if="!videoOnly && side" />
      <neko-connect v-if="!connected" />
      <neko-about v-if="about" />
      <notifications
        v-if="!videoOnly"
        group="neko"
        position="top left"
        style="top: 50px; pointer-events: none"
        :ignoreDuplicates="true"
      />
    </template>
  </div>
</template>

<style lang="scss">
  #neko {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    max-width: 100vw;
    max-height: 100vh;
    flex-direction: row;
    display: flex;

    .neko-main {
      min-width: 360px;
      max-width: 100%;
      flex-grow: 1;
      flex-direction: column;
      display: flex;
      overflow: auto;

      .header-container {
        background: $background-tertiary;
        height: $menu-height;
        flex-shrink: 0;
        display: flex;
      }

      .video-container {
        background: rgba($color: #000, $alpha: 0.4);
        max-width: 100%;
        flex-grow: 1;
        display: flex;
      }

      .room-container {
        background: $background-tertiary;
        height: $controls-height;
        max-width: 100%;
        flex-shrink: 0;
        flex-direction: column;
        display: flex;

        .room-menu {
          max-width: 100%;
          flex: 1;
          display: flex;

          .settings {
            margin-left: 10px;
            flex: 1;
            justify-content: flex-start;
            align-items: center;
            display: flex;
          }

          .controls {
            flex: 1;
            justify-content: center;
            align-items: center;
            display: flex;
          }

          .emotes {
            margin-right: 10px;
            flex: 1;
            justify-content: flex-end;
            align-items: center;
            display: flex;
          }

          .video-controls {
            margin-right: 10px;
            flex-shrink: 0;
            justify-content: flex-end;
            align-items: center;
            display: flex;

            .video-menu {
              display: flex;

              li {
                margin: 0 5px;

                i {
                  width: 30px;
                  height: 30px;
                  background: rgba($color: #fff, $alpha: 0.2);
                  border-radius: 5px;
                  line-height: 30px;
                  font-size: 16px;
                  text-align: center;
                  color: rgba($color: #fff, $alpha: 0.6);
                  cursor: pointer;
                }
              }
            }
          }
        }
      }
    }

    &.theater-mode {
      .neko-main {
        .video-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 10;
        }

        .header-container {
          opacity: 0;
          transition: opacity 0.3s;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          z-index: 15;

          &:hover {
            opacity: 1;
          }
        }

        .room-container {
          opacity: 0;
          transition: opacity 0.3s;
          position: fixed;
          bottom: 0;
          left: 0;
          width: calc(100% - var(--chat-width));
          z-index: 15;

          &:hover {
            opacity: 1;
          }
        }
      }

      .neko-menu {
        position: fixed;
        right: 0;
        top: 0;
        height: 100vh;
        width: var(--chat-width);
        z-index: 30;
        background-color: rgba($background-primary, 0.1);
        resize: horizontal;
        overflow: auto;
        border-left: 5px solid rgba($color: #fff, $alpha: 0.1);

        &:hover {
          border-left: 5px solid rgba($color: #fff, $alpha: 0.3);
          cursor: ew-resize;
        }

        .chat-history {
          li {
            background-color: rgba($background-primary, 0.5);
            opacity: 1;
          }
          opacity: 1;
        }
      }
    }
  }

  @media only screen and (max-width: 1024px) {
    html,
    body {
      overflow-y: auto !important;
      width: auto !important;
      height: auto !important;
    }

    body > p {
      display: none;
    }

    #neko {
      position: relative;
      flex-direction: column;
      max-height: initial !important;

      .neko-main {
        height: 100vh;
      }

      .neko-menu {
        height: 100vh;
        width: 100% !important;
      }
    }
  }

  @media only screen and (max-width: 1024px) and (orientation: portrait) {
    #neko {
      &.expanded .neko-main {
        height: 40vh;
      }

      &.expanded .neko-menu {
        height: 60vh;
        width: 100% !important;
      }
    }
  }

  @media only screen and (max-width: 768px) {
    #neko .neko-main .room-container {
      display: none;
    }
  }
</style>

<script lang="ts">
  import { Vue, Component, Ref, Watch } from 'vue-property-decorator'

  import Connect from '~/components/connect.vue'
  import Video from '~/components/video.vue'
  import Menu from '~/components/menu.vue'
  import Side from '~/components/side.vue'
  import Controls from '~/components/controls.vue'
  import Members from '~/components/members.vue'
  import Emotes from '~/components/emotes.vue'
  import About from '~/components/about.vue'
  import Header from '~/components/header.vue'
  import Unsupported from '~/components/unsupported.vue'

  @Component({
    name: 'neko',
    components: {
      'neko-connect': Connect,
      'neko-video': Video,
      'neko-menu': Menu,
      'neko-side': Side,
      'neko-controls': Controls,
      'neko-members': Members,
      'neko-emotes': Emotes,
      'neko-about': About,
      'neko-header': Header,
      'neko-unsupported': Unsupported,
    },
  })
  export default class App extends Vue {
    @Ref('video') video!: Video

    shakeKbd = false

    get admin() {
      return this.$accessor.user.admin
    }

    get volume() {
      const numberParam = parseFloat(new URL(location.href).searchParams.get('volume') || '1.0')
      return Math.max(0.0, Math.min(!isNaN(numberParam) ? numberParam * 100 : 100, 100))
    }

    get isCastMode() {
      return !!new URL(location.href).searchParams.get('cast')
    }

    get isEmbedMode() {
      return !!new URL(location.href).searchParams.get('embed')
    }

    get hideControls() {
      return this.isCastMode
    }

    get videoOnly() {
      return this.isCastMode || this.isEmbedMode
    }

    @Watch('volume', { immediate: true })
    onVolume(volume: number) {
      if (new URL(location.href).searchParams.has('volume')) {
        this.$accessor.video.setVolume(volume)
      }
    }

    @Watch('hideControls', { immediate: true })
    onHideControls(enabled: boolean) {
      if (enabled) {
        this.$accessor.video.setMuted(false)
        this.$accessor.settings.setSound(false)
      }
    }

    @Watch('side')
    onSide(side: boolean) {
      if (side) {
        console.log('side enabled')
        // scroll to the side
        this.$nextTick(() => {
          const side = document.querySelector('aside')
          if (side) {
            side.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        })
      }
    }

    controlAttempt() {
      if (this.shakeKbd || this.$accessor.remote.hosted) return

      this.shakeKbd = true
      window.setTimeout(() => (this.shakeKbd = false), 5000)
    }

    get about() {
      return this.$accessor.client.about
    }

    get side() {
      return this.$accessor.client.side
    }

    get theaterMode() {
      return this.$accessor.client.theaterMode
    }

    get chatWidth() {
      return this.$accessor.client.chatWidth + 'px'
    }

    get connected() {
      return this.$accessor.connected
    }

    requestFullscreen() {
      this.video.requestFullscreen()
    }

    toggleTheaterMode() {
      this.$accessor.client.toggleTheaterMode()
    }

    openResolution(event: MouseEvent) {
      this.video.openResolution(event)
    }
  }
</script>
