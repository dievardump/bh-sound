//jshint esversion: 6

if (!window.AudioContext && !window.webkitAudioContext) {
    throw new Error('AudioContext is required');
}

const AudioCtx = window.AudioContext || window.webkitAudioContext;
const context = new AudioCtx();
let audioAnimation;
let audioBuffer;
let sourceNode;
let analyser;
let audio;

// get the context from the canvas to draw on
const canvas = document.createElement('canvas');

const bars = 12,
    spaces = bars - 1,
    barSize = 20,
    spaceSize = barSize / 2,
    width = canvas.width = bars * barSize + spaces * spaceSize,
    height = canvas.height = 160,
    startX = width / 2 - ((bars / 2) * barSize + (spaces / 2) * spaceSize),
    ctx = canvas.getContext("2d");

document.getElementById('berghain').appendChild(canvas);

ctx.fillStyle = '#249f89';

function setupAudioNodes() {
    analyser = (analyser || context.createAnalyser());
    analyser.smoothingTimeConstant = 0.8;
    analyser.fftSize = 32;

    sourceNode = context.createMediaElementSource(audio);
    sourceNode.connect(analyser);
    sourceNode.connect(context.destination);

    audio.play();
    drawSpectrum();
}

function loadSong(url) {
    if (audio) audio.remove();
    if (sourceNode) sourceNode.disconnect();
    cancelAnimationFrame(audioAnimation);
    if (audio) {
        audio.pause();
    }

    audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.addEventListener("canplay", function(e) {
        setupAudioNodes();
    }, false);
    
    audio.src = url;
}

function drawSpectrum() {
    var array = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(array);
    ctx.clearRect(0, 0, width, height);
    audioAnimation = requestAnimationFrame(drawSpectrum);
    for (var i = 0; i < (array.length) && i < bars; i++) {
        var value = array[i] * height / 256;
        ctx.fillRect(startX + i * (barSize + spaceSize), height - value, barSize, height);
    }
}

const __CLIENT_ID__ = '79ecc88b1e805bffdffe7b1665167d02';
const panoURL = 'https://soundcloud.com/ostgutton-official/';
const Ps = require('perfect-scrollbar');
let currentLink = null;

document.addEventListener('DOMContentLoaded', function() {
    const el = document.getElementById('list'),
        list = el.querySelector('ul');

    SC.initialize({
        client_id: __CLIENT_ID__
    });

    SC.resolve(panoURL)
        .then((user) => {
            if (user) {
                return SC.get('/users/' + user.id + '/tracks');
            }
        })
        .then((tracks) => {
            console.log(tracks);
            const docFragment = document.createDocumentFragment();
            tracks.forEach((track) => {
                const li = document.createElement('li'),
                    a = document.createElement('a');
                a.href = track.stream_url;
                a.textContent = a.title = track.title;

                a.addEventListener('click', scLoadTrack);
                li.appendChild(a);
                docFragment.appendChild(li);
            });

            while (list.firstChild) {
                list.removeChild(list.firstChild);
            }

            list.appendChild(docFragment);
            Ps.update(el);
            if (tracks.length) {
                list.querySelector('a').click();
            }
        });

    function scLoadTrack(event) {
        event.preventDefault();
        const element = event.currentTarget,
            link = element.href;

        if (currentLink) {
            currentLink.classList.remove('playing');
        }
        currentLink = element;
        currentLink.classList.add('playing');
        loadSong(link + '?client_id=' + __CLIENT_ID__);
    }


    Ps.initialize(el);
});