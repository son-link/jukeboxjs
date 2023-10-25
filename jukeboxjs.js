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
          --text: ${this.color_text};
          --bg: ${this.color_bg};
          --playlist: ${this.color_playlist};
          --btn: ${this.color_btn};
          --range1: ${this.color_range};
          --range2: ${this.color_range2};
        }

        #media-player {
          display: flex;
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
          padding: .5rem;
        }

        #controls,
        #volume,
        #time,
        #main-controls {
          display: flex;
          flex-wrap; wrap;
          align-items: center;
          gap: .5rem
        }

        #time {
          margin-bottom: .5rem
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
          max-height: inherit
        }

        #playlist > li {
          cursor: pointer;
          display: flex;
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
          -webkit-mask-image: url('assets/play.svg');
          mask-image: url('assets/play.svg');
          -webkit-mask-image: url('assets/play.svg');
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
          display: flex;
          justify-content: center;
          align-items: center;
        }

        #play-pause > .icon {
          background-color: var(--bg);
        }

        #play-pause.playing > .icon {
          -webkit-mask-image: url('assets/pause.svg');
          mask-image: url('assets/pause.svg');
        }

        #toggle-pl {
          -webkit-mask-image: url('assets/playlist.svg');
          mask-image: url('assets/playlist.svg');
          float: right;
        }

        #seek {
          flex-grow: 1;
        }

        #seek > input {
          width: 100%
        }

        #volume-icon {
          -webkit-mask-image: url('assets/volume-high.svg');
          mask-image: url('assets/volume-high.svg');
        }

        #prev-track {
          -webkit-mask-image: url('assets/previous.svg');
          mask-image: url('assets/previous.svg');
        }

        #next-track {
          -webkit-mask-image: url('assets/next.svg');
          mask-image: url('assets/next.svg');
        }

        #backward {
          -webkit-mask-image: url('assets/seek-backward-10.svg');
          mask-image: url('assets/seek-backward-10.svg');
        }

        #forward {
          -webkit-mask-image: url('assets/seek-forward-10.svg');
          mask-image: url('assets/seek-forward-10.svg');
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
          -webkit-mask-image: url('assets/mute.svg');
          mask-image: url('assets/mute.svg');
        }

        #volume,
        #toggle-pl-div {
          width: 25%
        }

        input[type="range"] {
          -webkit-appearance: none;
          width: 100%;
          height: 7px;
          background: rgba(255, 255, 255, 0.6);
          border-radius: 5px;
          background-image: linear-gradient(to right, var(--range1), var(--range2));
          background-size: 0% 100%;
          background-repeat: no-repeat;
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 1.2rem;
          width: 1.2rem;
          border-radius: 50%;
          cursor: ew-resize;
          box-shadow: 0 0 2px 0 #555;
          background-color: var(--btn);
        }
        
        input[type=range]::-webkit-slider-runnable-track  {
          -webkit-appearance: none;
          box-shadow: none;
          border: none;
          background: transparent;
        }

        input[type="range"]::-moz-range-thumb {
          border: 0;
          border-radius: 50%;
          background-color: var(--btn);
          height: 1.2rem;
          width: 1.2rem;
        }

        input[type="range"]:focus::-moz-range-thumb {
          border: 1px solid var(--playlist);
          outline: 3px solid var(--playlist);
          outline-offset: 0.125rem; 
        }
        
        @media (max-width: 575px) {
          #main-controls {
            order: -1
          }

          #volume,
          #toggle-pl-div {
            width: auto
          }
        }
      </style>
      <div id="media-player">
        <div id="player">
          <div id="track-title">Son Link - JukeboxJS</div>
          <div id="time">
            <div id="current-time">00:00:00</div>
             <div id="seek">
              <input type="range" min="0" max="100" value="0">
            </div>
            <div id="track-time">00:00:00</div>
          </div>
          <div id="controls">
            <div id="volume">
              <div id="volume-icon" class="icon"></div>
              <input type="range" min="0" max="100" value="100">
            </div>
            <div id="main-controls">
              <button id="prev-track" class="icon"></button>
              <button id="backward" class="icon"></button>
              <div id="play-pause">
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
