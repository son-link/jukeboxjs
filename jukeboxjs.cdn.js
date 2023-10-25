class JukeboxJS extends HTMLElement {
  constructor() {
    super();
    this.playlist = [];
    this.data = null;
    this.currentTrack = null

    // Set colors
    this.color_text = '#f5f5f5'
    this.color_bg = '#283739'
    this.color_btn = '#a9c52f'
    this.color_playlist = '#2c5d63'
    this.color_range = this.color_playlist
    this.color_range2 = this.color_btn

    // El shadow-root es, por así decirlo, el equivalente a document
    const shadowRoot = this.attachShadow({mode: 'open'});

    // Indicamos la plantilla a usar
    shadowRoot.innerHTML = this.template;

    // Según el tipo de multimedia usaremos Audio o Video
    this.player = new Audio()
    this.playlist_ul = this.shadowRoot.querySelector('#playlist');
    this.seekbar = this.shadowRoot.querySelector('#seek > input');
    this.volumebar = this.shadowRoot.querySelector('#volume > input');
    this.play_btn = this.shadowRoot.querySelector('#play-pause');
    this.toggle_pl = this.shadowRoot.querySelector('#toggle-pl');
    this.track_title = this.shadowRoot.querySelector('#track-title');
    this.prev_track = this.shadowRoot.querySelector('#prev-track');
    this.next_track = this.shadowRoot.querySelector('#next-track');
    this.backward_10 = this.shadowRoot.querySelector('#backward');
    this.forward_10 = this.shadowRoot.querySelector('#forward');
    this.muted_btn = this.shadowRoot.querySelector('#volume-icon');
    this.playlist_open = false
    this.volumebar.style.backgroundSize = `${this.player.volume * 100}% 100%`

    // Añadimos las escuchas a los eventos
    this.player.addEventListener('durationchange', () => {
      const duration = this.player.duration
      this.shadowRoot.querySelector('#track-time').innerText = this.secs2time(duration)
      this.seekbar.max = duration
    })

    this.player.addEventListener('play', () => {
      this.play_btn.classList.add('playing')
    })

    this.player.addEventListener('pause', () => {
      this.play_btn.classList.remove('playing')
    })

    this.player.addEventListener('timeupdate', () => {
      const currentTime = this.player.currentTime
      this.shadowRoot.querySelector('#current-time').innerText = this.secs2time(currentTime)
      const progress = currentTime * (100 / this.player.duration)
      this.seekbar.style.backgroundSize = `${progress}% 100%`
      this.seekbar.value = currentTime
    })

    this.seekbar.addEventListener('change', (e) => {
      this.player.currentTime = e.target.value
    })

    this.volumebar.addEventListener('change', (e) => {
      this.player.volume = e.target.value / 100
      this.volumebar.style.backgroundSize = `${e.target.value}% 100%`
    })

    this.play_btn.addEventListener('click', (e) => {
      if (this.playlist.length == 0) return

      if (this.currentTrack === null) {
        const first = this.playlist_ul.querySelector('li')
        first.click()
      } else {
        if (this.player.paused) this.player.play()
        else this.player.pause()
      }
    })

    this.toggle_pl.addEventListener('click', (e) => {
      this.playlist_open = !this.playlist_open

      if (this.playlist_open) this.playlist_ul.classList.add('open')
      else this.playlist_ul.classList.remove('open')
    })

    this.prev_track.addEventListener('click', () => {
      if (this.currentTrack > 0) {
        this.currentTrack--
        this.playlist_ul.querySelectorAll('li')[this.currentTrack].click()
      }
    })

    this.next_track.addEventListener('click', () => this.next())
    this.player.addEventListener('ended', () => this.next())

    this.backward_10.addEventListener('click', () => {
      this.player.currentTime -= 10
    })

    this.forward_10.addEventListener('click', () => {
      this.player.currentTime += 10
    })

    this.muted_btn.addEventListener('click', () => {
      this.player.muted = !this.player.muted

      if (this.player.muted) this.muted_btn.classList.add('muted')
      else this.muted_btn.classList.remove('muted')
    })
  }

  static get observedAttributes() {
    return ['src', 'playlist', 'color-text', 'color-bg', 'color-btn', 'color-playlist', 'color-range'];
  }

  // Esta es la función que contiene la plantilla con el visor y en un futuro el editor
  get template() {
    return `
      <style>
        :host {
          /* Colors */
          --text: ${this.color_text};
          --bg: ${this.color_bg};
          --playlist: ${this.color_playlist};
          --btn: ${this.color_btn};
          --range1: ${this.color_range};
          --range2: ${this.color_range2};
          /* Icons */
          --icon-play: url('data:image/svg+xml;base64,PHN2ZyByb2xlPSJpbWciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGFyaWEtaGlkZGVuPSJ0cnVlIj48cGF0aCBkPSJNMTAuNjY2NyA2LjY1NDhDMTAuNjY2NyA2LjEwNzY0IDExLjI4OTQgNS43OTM0NiAxMS43Mjk1IDYuMTE4NjJMMjQuMzc3IDE1LjQ2MzRDMjQuNzM3NyAxNS43Mjk4IDI0LjczNzcgMTYuMjY5MiAyNC4zNzcxIDE2LjUzNTdMMTEuNzI5NSAyNS44ODEzQzExLjI4OTUgMjYuMjA2NSAxMC42NjY3IDI1Ljg5MjMgMTAuNjY2NyAyNS4zNDUxTDEwLjY2NjcgNi42NTQ4WiIgZmlsbD0iY3VycmVudENvbG9yIj48L3BhdGg+PC9zdmc+');
          --icon-pause: url('data:image/svg+xml;base64,PHN2ZyByb2xlPSJpbWciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGFyaWEtaGlkZGVuPSJ0cnVlIj48cGF0aCBkPSJNOC42NjY2NyA2LjY2NjY3QzguMjk4NDggNi42NjY2NyA4IDYuOTY1MTQgOCA3LjMzMzMzVjI0LjY2NjdDOCAyNS4wMzQ5IDguMjk4NDggMjUuMzMzMyA4LjY2NjY3IDI1LjMzMzNIMTIuNjY2N0MxMy4wMzQ5IDI1LjMzMzMgMTMuMzMzMyAyNS4wMzQ5IDEzLjMzMzMgMjQuNjY2N1Y3LjMzMzMzQzEzLjMzMzMgNi45NjUxNCAxMy4wMzQ5IDYuNjY2NjcgMTIuNjY2NyA2LjY2NjY3SDguNjY2NjdaIiBmaWxsPSJjdXJyZW50Q29sb3IiPjwvcGF0aD4KPHBhdGggZD0iTTE5LjMzMzMgNi42NjY2N0MxOC45NjUxIDYuNjY2NjcgMTguNjY2NyA2Ljk2NTE0IDE4LjY2NjcgNy4zMzMzM1YyNC42NjY3QzE4LjY2NjcgMjUuMDM0OSAxOC45NjUxIDI1LjMzMzMgMTkuMzMzMyAyNS4zMzMzSDIzLjMzMzNDMjMuNzAxNSAyNS4zMzMzIDI0IDI1LjAzNDkgMjQgMjQuNjY2N1Y3LjMzMzMzQzI0IDYuOTY1MTQgMjMuNzAxNSA2LjY2NjY3IDIzLjMzMzMgNi42NjY2N0gxOS4zMzMzWiIgZmlsbD0iY3VycmVudENvbG9yIj48L3BhdGg+PC9zdmc+');
          --icon-previous: url('data:image/svg+xml;base64,PHN2ZyByb2xlPSJpbWciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGFyaWEtaGlkZGVuPSJ0cnVlIj48cGF0aCBkPSJNMjUuMTM3NyA2Ljc4NTMyQzI1LjU3NzggNi40NjAxNyAyNi4yMDA1IDYuNzc0MzQgMjYuMjAwNSA3LjMyMTUxVjI0LjY3ODVDMjYuMjAwNSAyNS4yMjU3IDI1LjU3NzcgMjUuNTM5OCAyNS4xMzc3IDI1LjIxNDdMMTMuMzkyNCAxNi41MzU4QzEzLjAzMTcgMTYuMjY5MyAxMy4wMzE3IDE1LjcyOTkgMTMuMzkyNCAxNS40NjM0TDI1LjEzNzcgNi43ODUzMloiIGZpbGw9ImN1cnJlbnRDb2xvciI+PC9wYXRoPgo8cGF0aCBkPSJNOCA2LjY2NjdDOC4zNjgxOSA2LjY2NjcgOC42NjY2NyA2Ljk2NTE4IDguNjY2NjcgNy4zMzMzN1YyNC42NjY3QzguNjY2NjcgMjUuMDM0OSA4LjM2ODE5IDI1LjMzMzQgOCAyNS4zMzM0SDZDNS42MzE4MSAyNS4zMzM0IDUuMzMzMzMgMjUuMDM0OSA1LjMzMzMzIDI0LjY2NjdWNy4zMzMzN0M1LjMzMzMzIDYuOTY1MTggNS42MzE4MSA2LjY2NjcgNiA2LjY2NjdIOFoiIGZpbGw9ImN1cnJlbnRDb2xvciI+PC9wYXRoPjwvc3ZnPg==');
          --icon-next: url('data:image/svg+xml;base64,PHN2ZyByb2xlPSJpbWciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGFyaWEtaGlkZGVuPSJ0cnVlIj48cGF0aCBkPSJNNi4zOTYxNyA2Ljc4NTMyQzUuOTU2MSA2LjQ2MDE3IDUuMzMzMzQgNi43NzQzNCA1LjMzMzM0IDcuMzIxNTFWMjQuNjc4NUM1LjMzMzM0IDI1LjIyNTcgNS45NTYxMiAyNS41Mzk4IDYuMzk2MTkgMjUuMjE0N0wxOC4xNDE1IDE2LjUzNThDMTguNTAyMSAxNi4yNjkzIDE4LjUwMjEgMTUuNzI5OSAxOC4xNDE1IDE1LjQ2MzRMNi4zOTYxNyA2Ljc4NTMyWiIgZmlsbD0iY3VycmVudENvbG9yIj48L3BhdGg+CjxwYXRoIGQ9Ik0yMy41MzM5IDYuNjY2N0MyMy4xNjU3IDYuNjY2NyAyMi44NjcyIDYuOTY1MTggMjIuODY3MiA3LjMzMzM3VjI0LjY2NjdDMjIuODY3MiAyNS4wMzQ5IDIzLjE2NTcgMjUuMzMzNCAyMy41MzM5IDI1LjMzMzRIMjUuNTMzOUMyNS45MDIgMjUuMzMzNCAyNi4yMDA1IDI1LjAzNDkgMjYuMjAwNSAyNC42NjY3VjcuMzMzMzdDMjYuMjAwNSA2Ljk2NTE4IDI1LjkwMiA2LjY2NjcgMjUuNTMzOSA2LjY2NjdIMjMuNTMzOVoiIGZpbGw9ImN1cnJlbnRDb2xvciI+PC9wYXRoPjwvc3ZnPg==');
          --icon-backward: url('data:image/svg+xml;base64,PHN2ZyByb2xlPSJpbWciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGFyaWEtaGlkZGVuPSJ0cnVlIj48cGF0aCBkPSJNMTYuNjY2NyAxMC4zNDUyQzE2LjY2NjcgMTAuODkyNCAxNi4wNDM5IDExLjIwNjYgMTUuNjAzOCAxMC44ODE0TDExLjA3NjYgNy41MzY0QzEwLjcxNTkgNy4yNjk5MyAxMC43MTU5IDYuNzMwNTQgMTEuMDc2NiA2LjQ2NDA1TDE1LjYwMzggMy4xMTg3M0MxNi4wNDM5IDIuNzkzNTYgMTYuNjY2NyAzLjEwNzczIDE2LjY2NjcgMy42NTQ5VjUuMjI2ODJDMTYuNjY2NyA1LjI5NzQ2IDE2LjcyMjMgNS4zNTU3OSAxNi43OTI3IDUuMzYwNjZDMjIuNjgyMSA1Ljc2NzU3IDI3LjMzMzMgMTAuNjc0IDI3LjMzMzMgMTYuNjY2N0MyNy4zMzMzIDIyLjkyNTkgMjIuMjU5MiAyOCAxNiAyOEM5Ljk2NDgzIDI4IDUuMDMxNDUgMjMuMjgyNyA0LjY4NjAxIDE3LjMzNDFDNC42NjQ2NiAxNi45NjY1IDQuOTY1MTggMTYuNjY3MyA1LjMzMzM5IDE2LjY2NzNINy4zMzM0QzcuNzAxNTcgMTYuNjY3MyA3Ljk5NzE0IDE2Ljk2NjggOC4wMjc0MyAxNy4zMzM3QzguMzY2MzggMjEuNDM5OSAxMS44MDY0IDI0LjY2NjcgMTYgMjQuNjY2N0MyMC40MTgzIDI0LjY2NjcgMjQgMjEuMDg1IDI0IDE2LjY2NjdDMjQgMTIuNTIyNSAyMC44NDgzIDkuMTE0MjggMTYuODExMyA4LjcwNzM5QzE2LjczMzcgOC42OTk1NyAxNi42NjY3IDguNzYwOTYgMTYuNjY2NyA4LjgzODkzVjEwLjM0NTJaIiBmaWxsPSJjdXJyZW50Q29sb3IiPjwvcGF0aD4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xNy4wODc5IDE5LjY3OUMxNy40NTUzIDE5LjkxOTUgMTcuODkyOCAyMC4wMzk4IDE4LjQwMDQgMjAuMDM5OEMxOC45MDk5IDIwLjAzOTggMTkuMzQ3NCAxOS45MjA1IDE5LjcxMjkgMTkuNjgxOEMyMC4wODAzIDE5LjQ0MTMgMjAuMzYzNSAxOS4wOTM4IDIwLjU2MjMgMTguNjM5MkMyMC43NjEyIDE4LjE4NDcgMjAuODYwNiAxNy42MzczIDIwLjg2MDYgMTYuOTk3MkMyMC44NjI1IDE2LjM2MDggMjAuNzY0IDE1LjgxOTIgMjAuNTY1MiAxNS4zNzIyQzIwLjM2NjMgMTQuOTI1MiAyMC4wODIyIDE0LjU4NTMgMTkuNzEyOSAxNC4zNTIzQzE5LjM0NTUgMTQuMTE3NSAxOC45MDggMTQgMTguNDAwNCAxNEMxNy44OTI4IDE0IDE3LjQ1NTMgMTQuMTE3NSAxNy4wODc5IDE0LjM1MjNDMTYuNzIyNCAxNC41ODUzIDE2LjQ0MDIgMTQuOTI1MiAxNi4yNDEzIDE1LjM3MjJDMTYuMDQ0MyAxNS44MTczIDE1Ljk0NDkgMTYuMzU4OSAxNS45NDMgMTYuOTk3MkMxNS45NDExIDE3LjYzNTQgMTYuMDM5NiAxOC4xODE4IDE2LjIzODUgMTguNjM2NEMxNi40MzczIDE5LjA4OSAxNi43MjA1IDE5LjQzNjYgMTcuMDg3OSAxOS42NzlaTTE5LjEzNjIgMTguNDI2MkMxOC45NDg3IDE4LjczNDkgMTguNzAzNCAxOC44ODkyIDE4LjQwMDQgMTguODg5MkMxOC4xOTk2IDE4Ljg4OTIgMTguMDIyNiAxOC44MjExIDE3Ljg2OTEgMTguNjg0N0MxNy43MTU3IDE4LjU0NjQgMTcuNTk2NCAxOC4zMzcyIDE3LjUxMTIgMTguMDU2OEMxNy40Mjc5IDE3Ljc3NjUgMTcuMzg3MSAxNy40MjMzIDE3LjM4OSAxNi45OTcyQzE3LjM5MDkgMTYuMzY4NCAxNy40ODQ3IDE1LjkwMjUgMTcuNjcwMyAxNS41OTk1QzE3Ljg1NTkgMTUuMjk0NSAxOC4wOTkzIDE1LjE0MjEgMTguNDAwNCAxNS4xNDIxQzE4LjYwMyAxNS4xNDIxIDE4Ljc4MDEgMTUuMjA5MyAxOC45MzE2IDE1LjM0MzhDMTkuMDgzMiAxNS40NzgyIDE5LjIwMTUgMTUuNjgyOCAxOS4yODY4IDE1Ljk1NzRDMTkuMzcyIDE2LjIzMDEgMTkuNDE0NiAxNi41NzY3IDE5LjQxNDYgMTYuOTk3MkMxOS40MTY1IDE3LjYzOTIgMTkuMzIzNyAxOC4xMTU2IDE5LjEzNjIgMTguNDI2MloiIGZpbGw9ImN1cnJlbnRDb2xvciI+PC9wYXRoPgo8cGF0aCBkPSJNMTMuNzc0NiAxOS44OTc4QzEzLjg0ODIgMTkuODk3OCAxMy45MDc5IDE5LjgzODEgMTMuOTA3OSAxOS43NjQ0VjE0LjIxMjlDMTMuOTA3OSAxNC4xMzkzIDEzLjg0ODIgMTQuMDc5NiAxMy43NzQ2IDE0LjA3OTZIMTIuNjQyQzEyLjYxNzEgMTQuMDc5NiAxMi41OTI3IDE0LjA4NjUgMTIuNTcxNiAxNC4wOTk3TDExLjIzMjIgMTQuOTMyNUMxMS4xOTMxIDE0Ljk1NjggMTEuMTY5MyAxNC45OTk2IDExLjE2OTMgMTUuMDQ1N1YxNS45NDk3QzExLjE2OTMgMTYuMDUzOSAxMS4yODMzIDE2LjExNzggMTEuMzcyMiAxNi4wNjM1TDEyLjQ2NCAxNS4zOTZDMTIuNDY4MiAxNS4zOTM0IDEyLjQ3MyAxNS4zOTIxIDEyLjQ3NzkgMTUuMzkyMUMxMi40OTI2IDE1LjM5MjEgMTIuNTA0NSAxNS40MDQgMTIuNTA0NSAxNS40MTg3VjE5Ljc2NDRDMTIuNTA0NSAxOS44MzgxIDEyLjU2NDIgMTkuODk3OCAxMi42Mzc4IDE5Ljg5NzhIMTMuNzc0NloiIGZpbGw9ImN1cnJlbnRDb2xvciI+PC9wYXRoPjwvc3ZnPg==');
          --icon-forward: url('data:image/svg+xml;base64,PHN2ZyByb2xlPSJpbWciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGFyaWEtaGlkZGVuPSJ0cnVlIj48cGF0aCBkPSJNMTUuMzMzMyAxMC4zNDUyQzE1LjMzMzMgMTAuODkyNCAxNS45NTYxIDExLjIwNjYgMTYuMzk2MiAxMC44ODE0TDIwLjkyMzQgNy41MzY0QzIxLjI4NDEgNy4yNjk5MyAyMS4yODQxIDYuNzMwNTQgMjAuOTIzNSA2LjQ2NDA1TDE2LjM5NjIgMy4xMTg3M0MxNS45NTYxIDIuNzkzNTYgMTUuMzMzMyAzLjEwNzczIDE1LjMzMzMgMy42NTQ5VjUuMjI2ODJDMTUuMzMzMyA1LjI5NzQ2IDE1LjI3NzggNS4zNTU3OSAxNS4yMDczIDUuMzYwNjZDOS4zMTc5MSA1Ljc2NzU3IDQuNjY2NjcgMTAuNjc0IDQuNjY2NjcgMTYuNjY2N0M0LjY2NjY3IDIyLjkyNTkgOS43NDA3OCAyOCAxNiAyOEMyMi4wMzUyIDI4IDI2Ljk2ODYgMjMuMjgyNyAyNy4zMTQgMTcuMzM0MUMyNy4zMzU0IDE2Ljk2NjUgMjcuMDM0OCAxNi42NjczIDI2LjY2NjYgMTYuNjY3M0gyNC42NjY2QzI0LjI5ODQgMTYuNjY3MyAyNC4wMDI5IDE2Ljk2NjggMjMuOTcyNiAxNy4zMzM3QzIzLjYzMzYgMjEuNDM5OSAyMC4xOTM3IDI0LjY2NjcgMTYgMjQuNjY2N0MxMS41ODE3IDI0LjY2NjcgOCAyMS4wODUgOCAxNi42NjY3QzggMTIuNTIyNSAxMS4xNTE3IDkuMTE0MjggMTUuMTg4NyA4LjcwNzM5QzE1LjI2NjMgOC42OTk1NyAxNS4zMzMzIDguNzYwOTYgMTUuMzMzMyA4LjgzODkzVjEwLjM0NTJaIiBmaWxsPSJjdXJyZW50Q29sb3IiPjwvcGF0aD4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xNy4wODc5IDE5LjY3OUMxNy40NTUzIDE5LjkxOTUgMTcuODkyOCAyMC4wMzk4IDE4LjQwMDQgMjAuMDM5OEMxOC45MDk5IDIwLjAzOTggMTkuMzQ3NCAxOS45MjA1IDE5LjcxMjkgMTkuNjgxOEMyMC4wODAzIDE5LjQ0MTMgMjAuMzYzNSAxOS4wOTM4IDIwLjU2MjMgMTguNjM5MkMyMC43NjEyIDE4LjE4NDcgMjAuODYwNiAxNy42MzczIDIwLjg2MDYgMTYuOTk3MkMyMC44NjI1IDE2LjM2MDggMjAuNzY0IDE1LjgxOTIgMjAuNTY1MiAxNS4zNzIyQzIwLjM2NjMgMTQuOTI1MiAyMC4wODIyIDE0LjU4NTMgMTkuNzEyOSAxNC4zNTIzQzE5LjM0NTUgMTQuMTE3NSAxOC45MDggMTQgMTguNDAwNCAxNEMxNy44OTI4IDE0IDE3LjQ1NTMgMTQuMTE3NSAxNy4wODc5IDE0LjM1MjNDMTYuNzIyNCAxNC41ODUzIDE2LjQ0MDIgMTQuOTI1MiAxNi4yNDEzIDE1LjM3MjJDMTYuMDQ0MyAxNS44MTczIDE1Ljk0NDkgMTYuMzU4OSAxNS45NDMgMTYuOTk3MkMxNS45NDExIDE3LjYzNTQgMTYuMDM5NiAxOC4xODE4IDE2LjIzODUgMTguNjM2NEMxNi40MzczIDE5LjA4OSAxNi43MjA1IDE5LjQzNjYgMTcuMDg3OSAxOS42NzlaTTE5LjEzNjIgMTguNDI2MkMxOC45NDg3IDE4LjczNDkgMTguNzAzNCAxOC44ODkyIDE4LjQwMDQgMTguODg5MkMxOC4xOTk2IDE4Ljg4OTIgMTguMDIyNSAxOC44MjExIDE3Ljg2OTEgMTguNjg0N0MxNy43MTU3IDE4LjU0NjQgMTcuNTk2NCAxOC4zMzcyIDE3LjUxMTIgMTguMDU2OEMxNy40Mjc4IDE3Ljc3NjUgMTcuMzg3MSAxNy40MjMzIDE3LjM4OSAxNi45OTcyQzE3LjM5MDkgMTYuMzY4NCAxNy40ODQ3IDE1LjkwMjUgMTcuNjcwMyAxNS41OTk1QzE3Ljg1NTkgMTUuMjk0NSAxOC4wOTkyIDE1LjE0MjEgMTguNDAwNCAxNS4xNDIxQzE4LjYwMyAxNS4xNDIxIDE4Ljc4MDEgMTUuMjA5MyAxOC45MzE2IDE1LjM0MzhDMTkuMDgzMSAxNS40NzgyIDE5LjIwMTUgMTUuNjgyOCAxOS4yODY3IDE1Ljk1NzRDMTkuMzcyIDE2LjIzMDEgMTkuNDE0NiAxNi41NzY3IDE5LjQxNDYgMTYuOTk3MkMxOS40MTY1IDE3LjYzOTIgMTkuMzIzNyAxOC4xMTU2IDE5LjEzNjIgMTguNDI2MloiIGZpbGw9ImN1cnJlbnRDb2xvciI+PC9wYXRoPgo8cGF0aCBkPSJNMTMuNzc0NiAxOS44OTc4QzEzLjg0ODIgMTkuODk3OCAxMy45MDc5IDE5LjgzODEgMTMuOTA3OSAxOS43NjQ0VjE0LjIxMjlDMTMuOTA3OSAxNC4xMzkzIDEzLjg0ODIgMTQuMDc5NiAxMy43NzQ2IDE0LjA3OTZIMTIuNjQyQzEyLjYxNzEgMTQuMDc5NiAxMi41OTI3IDE0LjA4NjUgMTIuNTcxNiAxNC4wOTk3TDExLjIzMjIgMTQuOTMyNUMxMS4xOTMxIDE0Ljk1NjggMTEuMTY5MyAxNC45OTk2IDExLjE2OTMgMTUuMDQ1N1YxNS45NDk3QzExLjE2OTMgMTYuMDUzOSAxMS4yODMzIDE2LjExNzggMTEuMzcyMiAxNi4wNjM1TDEyLjQ2NCAxNS4zOTZDMTIuNDY4MiAxNS4zOTM0IDEyLjQ3MyAxNS4zOTIxIDEyLjQ3NzkgMTUuMzkyMUMxMi40OTI2IDE1LjM5MjEgMTIuNTA0NSAxNS40MDQgMTIuNTA0NSAxNS40MTg3VjE5Ljc2NDRDMTIuNTA0NSAxOS44MzgxIDEyLjU2NDIgMTkuODk3OCAxMi42Mzc4IDE5Ljg5NzhIMTMuNzc0NloiIGZpbGw9ImN1cnJlbnRDb2xvciI+PC9wYXRoPjwvc3ZnPg==');
          --icon-volume: url('data:image/svg+xml;base64,PHN2ZyByb2xlPSJpbWciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGFyaWEtaGlkZGVuPSJ0cnVlIj48cGF0aCBkPSJNMTcuNTA5MSAyNC42NTk1QzE3LjUwOTEgMjUuMjA2NiAxNi44ODY0IDI1LjUyMDggMTYuNDQ2MyAyNS4xOTU2TDkuNDQ4NDcgMjAuMDI1MkM5LjQyNTUzIDIwLjAwODMgOS4zOTc3NiAxOS45OTkyIDkuMzY5MjMgMTkuOTk5Mkg0LjY2NjY3QzQuMjk4NDggMTkuOTk5MiA0IDE5LjcwMDcgNCAxOS4zMzI1VjEyLjY2NThDNCAxMi4yOTc2IDQuMjk4NDggMTEuOTk5MiA0LjY2NjY3IDExLjk5OTJIOS4zNzExNUM5LjM5OTY3IDExLjk5OTIgOS40Mjc0NSAxMS45OSA5LjQ1MDM5IDExLjk3MzFMMTYuNDQ2MyA2LjgwMzYzQzE2Ljg4NjMgNi40Nzg0NSAxNy41MDkxIDYuNzkyNjIgMTcuNTA5MSA3LjMzOThMMTcuNTA5MSAyNC42NTk1WiIgZmlsbD0iY3VycmVudENvbG9yIj48L3BhdGg+CjxwYXRoIGQ9Ik0yNy41MDkxIDkuMzMzMzZDMjcuODc3MyA5LjMzMzM2IDI4LjE3NTggOS42MzE4NCAyOC4xNzU4IDEwVjIyQzI4LjE3NTggMjIuMzY4MiAyNy44NzczIDIyLjY2NjcgMjcuNTA5MSAyMi42NjY3SDI2LjE3NThDMjUuODA3NiAyMi42NjY3IDI1LjUwOTEgMjIuMzY4MiAyNS41MDkxIDIyVjEwQzI1LjUwOTEgOS42MzE4NCAyNS44MDc2IDkuMzMzMzYgMjYuMTc1OCA5LjMzMzM2TDI3LjUwOTEgOS4zMzMzNloiIGZpbGw9ImN1cnJlbnRDb2xvciI+PC9wYXRoPgo8cGF0aCBkPSJNMjIuMTc1OCAxMkMyMi41NDQgMTIgMjIuODQyNCAxMi4yOTg1IDIyLjg0MjQgMTIuNjY2N1YxOS4zMzM0QzIyLjg0MjQgMTkuNzAxNiAyMi41NDQgMjAgMjIuMTc1OCAyMEgyMC44NDI0QzIwLjQ3NDMgMjAgMjAuMTc1OCAxOS43MDE2IDIwLjE3NTggMTkuMzMzNFYxMi42NjY3QzIwLjE3NTggMTIuMjk4NSAyMC40NzQzIDEyIDIwLjg0MjQgMTJIMjIuMTc1OFoiIGZpbGw9ImN1cnJlbnRDb2xvciI+PC9wYXRoPjwvc3ZnPg==');
          --icon-mute: url('data:image/svg+xml;base64,PHN2ZyByb2xlPSJpbWciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGFyaWEtaGlkZGVuPSJ0cnVlIj48cGF0aCBkPSJNMTcuNTA5MSAyNC42NTk0QzE3LjUwOTEgMjUuMjA2NiAxNi44ODY0IDI1LjUyMDggMTYuNDQ2MyAyNS4xOTU2TDkuNDQ4NDcgMjAuMDI1MkM5LjQyNTUzIDIwLjAwODMgOS4zOTc3NiAxOS45OTkxIDkuMzY5MjMgMTkuOTk5MUg0LjY2NjY3QzQuMjk4NDggMTkuOTk5MSA0IDE5LjcwMDYgNCAxOS4zMzI1VjEyLjY2NThDNCAxMi4yOTc2IDQuMjk4NDggMTEuOTk5MSA0LjY2NjY3IDExLjk5OTFIOS4zNzExNUM5LjM5OTY3IDExLjk5OTEgOS40Mjc0NSAxMS45OSA5LjQ1MDM5IDExLjk3M0wxNi40NDYzIDYuODAzNkMxNi44ODYzIDYuNDc4NDIgMTcuNTA5MSA2Ljc5MjU5IDE3LjUwOTEgNy4zMzk3N0wxNy41MDkxIDI0LjY1OTRaIiBmaWxsPSJjdXJyZW50Q29sb3IiPjwvcGF0aD4KPHBhdGggZD0iTTI4Ljg2MjEgMTMuNjQyMkMyOS4xMjI1IDEzLjM4MTggMjkuMTIyNSAxMi45NTk3IDI4Ljg2MjEgMTIuNjk5NEwyNy45MTkzIDExLjc1NjZDMjcuNjU5IDExLjQ5NjIgMjcuMjM2OCAxMS40OTYyIDI2Ljk3NjUgMTEuNzU2NkwyNC43MTM0IDE0LjAxOTdDMjQuNjYxMyAxNC4wNzE3IDI0LjU3NjkgMTQuMDcxNyAyNC41MjQ4IDE0LjAxOTdMMjIuMjYyIDExLjc1NjhDMjIuMDAxNiAxMS40OTY0IDIxLjU3OTUgMTEuNDk2NCAyMS4zMTkxIDExLjc1NjhMMjAuMzc2MyAxMi42OTk2QzIwLjExNiAxMi45NTk5IDIwLjExNiAxMy4zODIgMjAuMzc2MyAxMy42NDI0TDIyLjYzOTIgMTUuOTA1M0MyMi42OTEzIDE1Ljk1NzMgMjIuNjkxMyAxNi4wNDE4IDIyLjYzOTIgMTYuMDkzOEwyMC4zNzY4IDE4LjM1NjJDMjAuMTE2NSAxOC42MTY2IDIwLjExNjUgMTkuMDM4NyAyMC4zNzY4IDE5LjI5OUwyMS4zMTk2IDIwLjI0MTlDMjEuNTggMjAuNTAyMiAyMi4wMDIxIDIwLjUwMjIgMjIuMjYyNCAyMC4yNDE4TDI0LjUyNDggMTcuOTc5NUMyNC41NzY5IDE3LjkyNzQgMjQuNjYxMyAxNy45Mjc0IDI0LjcxMzQgMTcuOTc5NUwyNi45NzYgMjAuMjQyMUMyNy4yMzYzIDIwLjUwMjQgMjcuNjU4NSAyMC41MDI0IDI3LjkxODggMjAuMjQyMUwyOC44NjE2IDE5LjI5OTJDMjkuMTIyIDE5LjAzODkgMjkuMTIyIDE4LjYxNjggMjguODYxNiAxOC4zNTY0TDI2LjU5OSAxNi4wOTM4QzI2LjU0NyAxNi4wNDE4IDI2LjU0NyAxNS45NTczIDI2LjU5OSAxNS45MDUzTDI4Ljg2MjEgMTMuNjQyMloiIGZpbGw9ImN1cnJlbnRDb2xvciI+PC9wYXRoPjwvc3ZnPg==');
          --icon-playlist: url('data:image/svg+xml;base64,PHN2ZyByb2xlPSJpbWciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGFyaWEtaGlkZGVuPSJ0cnVlIj48cGF0aCBkPSJNMTIgNy42NjY2N0MxMiA3LjI5ODQ4IDEyLjI5ODUgNyAxMi42NjY2IDdIMjZDMjYuMzY4MiA3IDI2LjY2NjYgNy4yOTg0OCAyNi42NjY2IDcuNjY2NjdWOS42NjY2N0MyNi42NjY2IDEwLjAzNDkgMjYuMzY4MiAxMC4zMzMzIDI2IDEwLjMzMzNIMTIuNjY2NkMxMi4yOTg1IDEwLjMzMzMgMTIgMTAuMDM0OSAxMiA5LjY2NjY3VjcuNjY2NjdaIiBmaWxsPSJjdXJyZW50Q29sb3IiPjwvcGF0aD4KPHBhdGggZD0iTTEyIDE1QzEyIDE0LjYzMTggMTIuMjk4NSAxNC4zMzMzIDEyLjY2NjYgMTQuMzMzM0gyNkMyNi4zNjgyIDE0LjMzMzMgMjYuNjY2NiAxNC42MzE4IDI2LjY2NjYgMTVWMTdDMjYuNjY2NiAxNy4zNjgyIDI2LjM2ODIgMTcuNjY2NyAyNiAxNy42NjY3SDEyLjY2NjZDMTIuMjk4NSAxNy42NjY3IDEyIDE3LjM2ODIgMTIgMTdWMTVaIiBmaWxsPSJjdXJyZW50Q29sb3IiPjwvcGF0aD4KPHBhdGggZD0iTTUuOTk5OTggMjEuNjY2N0M1LjYzMTc5IDIxLjY2NjcgNS4zMzMzMSAyMS45NjUxIDUuMzMzMzEgMjIuMzMzM1YyNC4zMzMzQzUuMzMzMzEgMjQuNzAxNSA1LjYzMTc5IDI1IDUuOTk5OTggMjVINy45OTk5OEM4LjM2ODE3IDI1IDguNjY2NjUgMjQuNzAxNSA4LjY2NjY1IDI0LjMzMzNWMjIuMzMzM0M4LjY2NjY1IDIxLjk2NTEgOC4zNjgxNyAyMS42NjY3IDcuOTk5OTggMjEuNjY2N0g1Ljk5OTk4WiIgZmlsbD0iY3VycmVudENvbG9yIj48L3BhdGg+CjxwYXRoIGQ9Ik0xMi42NjY2IDIxLjY2NjdDMTIuMjk4NSAyMS42NjY3IDEyIDIxLjk2NTEgMTIgMjIuMzMzM1YyNC4zMzMzQzEyIDI0LjcwMTUgMTIuMjk4NSAyNSAxMi42NjY2IDI1SDI2QzI2LjM2ODIgMjUgMjYuNjY2NiAyNC43MDE1IDI2LjY2NjYgMjQuMzMzM1YyMi4zMzMzQzI2LjY2NjYgMjEuOTY1MSAyNi4zNjgyIDIxLjY2NjcgMjYgMjEuNjY2N0gxMi42NjY2WiIgZmlsbD0iY3VycmVudENvbG9yIj48L3BhdGg+CjxwYXRoIGQ9Ik01Ljk5OTk4IDE0LjMzMzNDNS42MzE3OSAxNC4zMzMzIDUuMzMzMzEgMTQuNjMxOCA1LjMzMzMxIDE1VjE3QzUuMzMzMzEgMTcuMzY4MiA1LjYzMTc5IDE3LjY2NjcgNS45OTk5OCAxNy42NjY3SDcuOTk5OThDOC4zNjgxNyAxNy42NjY3IDguNjY2NjUgMTcuMzY4MiA4LjY2NjY1IDE3VjE1QzguNjY2NjUgMTQuNjMxOCA4LjM2ODE3IDE0LjMzMzMgNy45OTk5OCAxNC4zMzMzSDUuOTk5OThaIiBmaWxsPSJjdXJyZW50Q29sb3IiPjwvcGF0aD4KPHBhdGggZD0iTTUuOTk5OTggN0M1LjYzMTc5IDcgNS4zMzMzMSA3LjI5ODQ4IDUuMzMzMzEgNy42NjY2N1Y5LjY2NjY3QzUuMzMzMzEgMTAuMDM0OSA1LjYzMTc5IDEwLjMzMzMgNS45OTk5OCAxMC4zMzMzSDcuOTk5OThDOC4zNjgxNyAxMC4zMzMzIDguNjY2NjUgMTAuMDM0OSA4LjY2NjY1IDkuNjY2NjdWNy42NjY2N0M4LjY2NjY1IDcuMjk4NDggOC4zNjgxNyA3IDcuOTk5OTggN0g1Ljk5OTk4WiIgZmlsbD0iY3VycmVudENvbG9yIj48L3BhdGg+PC9zdmc+');
        }

        .flex {
          display: flex;
          flex-wrap: wrap;
        }

        #media-player {
          flex-direction: column;
          background-color: var(--bg);
          color: var(--text);
          border-radius: .5rem;
          text-align: left;
        }

        #track-title {
          width: 100%;
          margin-bottom: 1rem;
        }

        #player {
          padding: 0.5rem;
        }

        #controls,
        #volume,
        #time,
        #main-controls {
          flex-wrap: wrap;
          align-items: center;
          gap: .5rem;
        }

        #time {
          margin-bottom: .5rem;
        }

        #controls {
          flex-wrap: nowrap;
          justify-content: space-between;
        }

        #playlist {
          list-style: none;
          padding: 0;
          margin: 0;
          margin-top: 1rem;
          background-color: var(--playlist);
          overflow: auto;
          display: block;
          max-height: 0;
          transition: all .5s ease-in;
          max-width: inherit;
          border-bottom-right-radius: .5rem;
          border-bottom-left-radius: .5rem;
        }

        #playlist.open {
          max-height: inherit;
        }

        #playlist > li {
          cursor: pointer;
          height: 24px;
          line-height: 24px;
          padding: .5rem;
        }

        #playlist > li > div {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        #playlist > li.current {
          background-color: var(--btn);
          color: var(--bg);
        }

        .pl-icon,
        .icon {
          width: 24px;
          height: 24px;
        }

        #playlist li.current > .pl-icon,
        .icon {
          mask-position: center;
          -webkit-mask-position: center;
          mask-size: 20px;
          -webkit-mask-size: 20px;
          mask-repeat: no-repeat;
          -webkit-mask-repeat: no-repeat;
          background-color: var(--btn);
          -webkit-mask-image: var(--icon-play);
          mask-image: var(--icon-play);
        }

        #playlist li.current > .pl-icon {
          background-color: var(--bg);
        }

        .pl-icon {
          margin-right: .5rem;
        }

        .icon {
          cursor: pointer;
        }

        #play-pause {
          background-color: var(--btn);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          justify-content: center;
          align-items: center;
        }

        #play-pause > .icon {
          background-color: var(--bg);
        }

        #play-pause.playing > .icon {
          -webkit-mask-image: var(--icon-pause);
          mask-image: var(--icon-pause);
        }

        #toggle-pl {
          -webkit-mask-image: var(--icon-playlist);
          mask-image: var(--icon-playlist);
          float: right;
        }

        #seek {
          flex-grow: 1;
        }

        #seek > input {
          width: 100%;
        }

        #volume-icon {
          -webkit-mask-image: var(--icon-volume);
          mask-image: var(--icon-volume);
        }

        #prev-track {
          -webkit-mask-image: var(--icon-previous);
          mask-image: var(--icon-previous);
        }

        #next-track {
          -webkit-mask-image: var(--icon-next);
          mask-image: var(--icon-next);
        }

        #backward {
          -webkit-mask-image: var(--icon-backward);
          mask-image: var(--icon-backward);
        }

        #forward {
          -webkit-mask-image: var(--icon-forward);
          mask-image: var(--icon-forward);
        }

        #backward,
        #forward {
          mask-size: 32px;
          -webkit-mask-size: 32px;
          width: 32px;
          height: 32px;
        }

        #volume > input {
          width: 5rem;
        }

        #volume-icon.muted {
          -webkit-mask-image: var(--icon-mute);
          mask-image: var(--icon-mute);
        }

        #volume,
        #toggle-pl-div {
          width: 25%;
        }

        input[type=range] {
          -webkit-appearance: none;
          width: 100%;
          height: 7px;
          background: rgba(255, 255, 255, 0.6);
          border-radius: 5px;
          background-image: linear-gradient(to right, var(--range1), var(--range2));
          background-size: 0% 100%;
          background-repeat: no-repeat;
        }

        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 1.2rem;
          width: 1.2rem;
          border-radius: 50%;
          cursor: ew-resize;
          box-shadow: 0 0 2px 0 #555;
          background-color: var(--btn);
        }

        input[type=range]::-webkit-slider-runnable-track {
          -webkit-appearance: none;
          box-shadow: none;
          border: none;
          background: transparent;
        }

        input[type=range]::-moz-range-thumb {
          border: 0;
          border-radius: 50%;
          background-color: var(--btn);
          height: 1.2rem;
          width: 1.2rem;
        }

        input[type=range]:focus::-moz-range-thumb {
          border: 1px solid var(--playlist);
          outline: 3px solid var(--playlist);
          outline-offset: 0.125rem;
        }

        @media (max-width: 575px) {
          #main-controls {
            order: -1;
          }
          #volume,
          #toggle-pl-div {
            width: auto;
          }
        }
      </style>
      <div id="media-player" class="flex">
        <div id="player">
          <div id="track-title">Son Link - JukeboxJS</div>
          <div id="time" class="flex">
            <div id="current-time">00:00:00</div>
             <div id="seek">
              <input type="range" min="0" max="100" value="0">
            </div>
            <div id="track-time">00:00:00</div>
          </div>
          <div id="controls" class="flex">
            <div id="volume" class="flex">
              <div id="volume-icon" class="icon"></div>
              <input type="range" min="0" max="100" value="100">
            </div>
            <div id="main-controls" class="flex">
              <button id="prev-track" class="icon"></button>
              <button id="backward" class="icon"></button>
              <div id="play-pause" class="flex">
                <div class="icon"></div>
              </div>
              <button id="forward" class="icon"></button>
              <button id="next-track" class="icon"></button>
            </div>
            <div id="toggle-pl-div">
              <div id="toggle-pl" class="icon"></div>
            </div>
          </div>
        </div>
        <ul id="playlist"></ul>
      </div>
    `
  }

  // Esta función se llama cada vez que se cambia una propiedad de la etiqueta del componente
  async attributeChangedCallback(attr, oldVal, newVal) {
    if(attr == 'src' && oldVal != newVal) {
      const title = newVal.split('/').slice(-1)
      this.playlist = []
      this.playlist.push({
        title: title,
        src: newVal
      })
      this.player.src = newVal
      this.currentTrack = 0
      this.track_title.innerText = title
    }

    if(attr == 'playlist' && oldVal != newVal && newVal) {
      // Obtenemos la lista de reproducción
      const resp = await fetch(newVal);
      const data = await resp.text();

      // Ahora vamos a obtener la URL base
      const base_url = newVal.split('/').slice(0, -1).join('/');

      if (data) {
        // Procedemos a ir leyendo las lineas del fichero
        const lines = data.split('\n');
        let hasTitle = false
        let trackInfo = {}
        lines.forEach( (line, index) => {
          line = line.trim();
          if (!line || line.startsWith('#EXTM3U')) return

          if (line.startsWith('#EXTINF')) {
            trackInfo.title = line.split(',').slice(1)
            hasTitle = true
          } else {
            if (hasTitle) {
              trackInfo.src = (line.startsWith('http')) ? line : `${base_url}/${line}`
            } else {
              const title = line.split('/').slice(-1)
              trackInfo.title = title
              trackInfo.src = (line.startsWith('http')) ? line : `${base_url}/${line}`
            }

            this.playlist.push(trackInfo)
            trackInfo = {}
          }
        });

        this.makePlayList()
      }
    }

    if (attr == 'color-text') this.style.setProperty('--text',  (!!newVal) ? newVal : '#f5f5f5')
    if (attr == 'color-bg') this.style.setProperty('--bg',  (!!newVal) ? newVal : '#283739')
    if (attr == 'color-btn') this.style.setProperty('--btn',  (!!newVal) ? newVal : '#a9c52f')
    if (attr == 'color-playlist') this.style.setProperty('--playlist',  (!!newVal) ? newVal : '#2c5d63')
    if (attr == 'color-range') {
      if (!!newVal) {
        const colors = newVal.split(',')
        this.style.setProperty('--range1', colors[0])
        this.style.setProperty('--range2', (colors.length == 2) ? colors[1] : colors[0])
      } else {
        this.style.setProperty('--range1', this.color_range)
        this.style.setProperty('--range2', this.color_range2)
      }
    }
  }

  makePlayList() {
    this.playlist_ul.innerHTML = ''
    this.playlist.forEach( (line, index) => {
      const li = document.createElement('li')
      li.setAttribute('data-track', index)
      li.classList.add('flex')
      li.innerHTML = `<div class="pl-icon"></div><div>${line.title}</div>`
      li.addEventListener('click', this.changeTrack)
      this.playlist_ul.appendChild(li)
    })
  }

  changeTrack = (e) => {
    const li = e.target.closest('li')
    const trackPos = li.getAttribute('data-track')
    const track = this.playlist[trackPos]
    this.currentTrack = trackPos
    this.player.src = track.src
    this.player.play()
    this.shadowRoot.querySelectorAll('#playlist > li').forEach ((ele, index) => {
      if (index == trackPos) ele.classList.add('current')
      else ele.classList.remove('current')
    })

    this.track_title.innerText = track.title
  }

  secs2time (seconds) {
    var seconds = parseInt(seconds, 10);
    var hours   = Math.floor(seconds / 3600);
    var minutes = Math.floor((seconds - (hours * 3600)) / 60);
    var seconds = seconds - (hours * 3600) - (minutes * 60);

    if (hours   < 10) hours   = "0" + hours;
    if (minutes < 10) minutes = "0" + minutes;
    if (seconds < 10) seconds = "0" + seconds;

    return hours+':'+minutes+':'+seconds;
  }

  next() {
    if (this.currentTrack < this.playlist.length - 1) {
      this.currentTrack++
      this.playlist_ul.querySelectorAll('li')[this.currentTrack].click()
    }
  }
}

// Y finalmente definimos el nuevo elemento
customElements.define('jukebox-js', JukeboxJS);
