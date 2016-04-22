//jshint esversion: 6
import { EventEmitter } from 'events';
const Ps = require('perfect-scrollbar');

if (!window.AudioContext && !window.webkitAudioContext) {
    throw new Error('AudioContext is required');
}

const AudioCtx = window.AudioContext || window.webkitAudioContext;
class AudioContextMakerLoader extends EventEmitter {
    constructor () {
        super();
        this.context = new AudioCtx();
        this.audioAnimation = null;
        this.audioBuffer = null;
        this.sourceNode = null;
        this.analyser = null;
        this.audio = null;
    }

    setupAudioNodes() {
        const analyser = this.analyser = (this.analyser || this.context.createAnalyser());
        analyser.smoothingTimeConstant = 0.8;
        analyser.fftSize = 32;

        const sourceNode = this.sourceNode = this.context.createMediaElementSource(this.audio);
        sourceNode.connect(analyser);
        sourceNode.connect(this.context.destination);

        this.audio.play();
    }

    loadURL(url) {
        if (this.audio) {
            this.audio.pause();
            this.audio.remove();
        }
        if (this.sourceNode) {
            this.sourceNode.disconnect();
        }
        

        this.audio = new Audio();
        this.audio.crossOrigin = 'anonymous';
        this.audio.addEventListener("canplay", (e) => {
            this.setupAudioNodes();
        }, false);
        
        this.audio.addEventListener("ended", (e) => {
            this.emit('ended');
        }, false);

        this.audio.src = url;
    }
}

const actxLoader = new AudioContextMakerLoader();
actxLoader.on('ended', () => {
    const links = [].slice.call(document.querySelectorAll('a'));
    if (links.length > 1) {
        let index = 0; 
        if (currentLink) {
            index = links.indexOf(currentLink);
            index = (index + 1) % links.length;
        }

        links[index].click();
    }
});

    
const __CLIENT_ID__ = '79ecc88b1e805bffdffe7b1665167d02',
    canvas = document.createElement('canvas'),
    list = document.getElementById('list'),
    error = document.getElementById('error'),
    bars = 13,
    spaces = bars - 1,
    barSize = 18,
    spaceSize = 11,
    width = canvas.width = bars * barSize + spaces * spaceSize,
    height = canvas.height = 160,
    startX = width / 2 - ((bars / 2) * barSize + (spaces / 2) * spaceSize),
    ctx = canvas.getContext("2d");

document.getElementById('building').appendChild(canvas);

ctx.fillStyle = '#249f89';
ctx.strokeStyle = '#249f89';

let currentLink = null;

/**
 * Drawing function
 * Get informations from the AudioContextLoader and draw equalizer
 **/
function drawSpectrum() {
    actxLoader.audioAnimation = requestAnimationFrame(drawSpectrum);

    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < bars; i++) {
        ctx.strokeRect(startX + i * (barSize + spaceSize), 0, barSize, height);
    }

    const analyser = actxLoader.analyser;
    if (analyser) {
        const array = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        for (let i = 0, value = null; i < (array.length) && i < bars; i++) {
            value = ~~(array[i] * height / 256);
            ctx.fillRect(startX + i * (barSize + spaceSize), height - value, barSize, height);
        }
    }
}


/**
 * Create song list children
 **/
function populateList(tracks) {
    while (list.firstChild) {
        list.removeChild(list.firstChild);
    }

    if (tracks.length) {
        const docFragment = document.createDocumentFragment(),
            ul = document.createElement('ul');
        tracks.forEach((track) => {
            const li = document.createElement('li'),
                a = document.createElement('a');
            a.href = track.stream_url;
            a.textContent = a.title = track.title;

            a.addEventListener('click', scLoadTrack);
            li.appendChild(a);
            ul.appendChild(li);
        });

        docFragment.appendChild(ul);

        list.appendChild(docFragment);
        list.querySelector('a').click();
    } else {
        const span = document.createElement('span');
        span.classList.add('no-element');
        span.textContent = 'No tracks to play';
        list.appendChild(span);
    }

    // update list scrollbar
    Ps.update(list);
}

/**
 *  EventLsitener
 *  Set AudioContextLoader to load new sound (clicked link href)
 **/
function scLoadTrack(event) {
    event.preventDefault();
    const element = event.currentTarget,
        link = element.href;

    if (currentLink) {
        currentLink.parentNode.classList.remove('playing');
    }
    if (element !== currentLink) {
        currentLink = element;
        currentLink.parentNode.classList.add('playing');
        actxLoader.loadURL(link + '?client_id=' + __CLIENT_ID__);
    } else {
        actxLoader.audio.pause();
        currentLink = null;
    }
}

/**
 *  Fetch soundcloud tracks from type
 **/
function fetchSC(resolve) {
    if (resolve) {
        if (resolve.kind === 'user') {
            return SC.get('/users/' + resolve.id + '/tracks');
        } else if (resolve.kind === "playlist") {
            return resolve.tracks;
        } else if (resolve.kind === 'track') {
            return [resolve];
        }   
    }
}

/**
 * EventListener on submit forum to fetch SoundCloud URL
 **/
function onSubmit(event) {
    event.preventDefault();
    if (currentLink) {
        currentLink.click();
    }

    const url = document.getElementById('soundcloundURL').value;
    if (url) {
        SC.resolve(url)
            .then(fetchSC)
            .then(populateList)
            .catch((e) => {
                console.log(e);
                populateList([]);
            });
    }
}

document.addEventListener('DOMContentLoaded', () => {


    SC.initialize({
        client_id: __CLIENT_ID__
    });

    // initialise list scrollbar
    Ps.initialize(list);

    // listen to fetch submit event
    document.getElementById('fetch').addEventListener('submit', onSubmit, false);

    // start drawing
    drawSpectrum();
    // submit the current value
    document.querySelector('input[type="submit"]').click();
});