/* reference:
    https://www.geeksforgeeks.org/create-a-music-player-using-javascript/#
*/

const highlight = "#54e37e";
const book_field = "book";
const chap_field = "chap";
const time_field = "time";

var photo = document.querySelector(".track-photo");
var title = document.getElementById("title");
var chapter = document.getElementById("chapter");

var play_button = document.querySelector(".play-pause");
var next_button = document.querySelector(".next-track");
var prev_button = document.querySelector(".prev-track");
var rewind = document.querySelector(".rewind");
var skip_ahead = document.querySelector(".skip_ahead");

var slider = document.querySelector(".slider_input");
var curr_time = document.getElementById("curr-time");
var total_time = document.getElementById("total-time");

var book_tracks = document.querySelector(".books");

// load from local storage if possible
var book_index = book_field in localStorage ? Number(localStorage[book_field]) : 0;
var chap_index = chap_field in localStorage ? Number(localStorage[chap_field]) : 0;

var update_timer;
var is_playing = false;

// list of ooks with folder name and chapter count
var books = [
  {title: "Book 1", folder: "1", chapters: 8},
  {title: "Book 2", folder: "2", chapters: 9},
  {title: "Book 3", folder: "3", chapters: 6},
  {title: "Book 4", folder: "4", chapters: 8},
  {title: "Book 5", folder: "5", chapters: 20},
  {title: "Book 6", folder: "6", chapters: 8}
];

// initialize and load first audio
var curr_track = document.createElement('audio');
loadTrack();
getInitTime();
populateBooks();


/* track info utility functions */

// return path to current chapter audio file
function getPath() {
    chap_file = (chap_index + 1).toString() + ".mp3";
    return getBookPath(book_index) + chap_file;
}

// get path to files of book at index i, ending in /
function getBookPath(i) {
    return "books/" + books[i]["folder"] + "/";
}

// get path to cover of book at index i
// function getCover(i) {
//     return getBookPath(i) + "cover.png";
// }


/* audio player functions */

// if current position saved in local storage, load stored time
function getInitTime() {
    if (book_field in localStorage && chap_field in localStorage && time_field in localStorage) {
        curr_track.currentTime = Number(localStorage[time_field]);
    }
}

// load track from start or skipping to next
function loadTrack() {
    resetSlider();

    // load new track
    curr_track.src = getPath();
    curr_track.load();

    // update track info
    // photo.src = getCover(book_index);
    title.textContent = books[book_index]["title"];
    chapter.textContent = "Chapter " + (chap_index + 1).toString();

    // set up audio slider with function to call every second (1000 ms)
    update_timer = setInterval(updateSlider, 1000);
    curr_track.addEventListener("ended", nextTrack);
}

// reset slider and time values upon load new track
function resetSlider() {
    clearInterval(update_timer);

    curr_time.textContent = "00:00";
    total_time.textContent = "00:00";
    slider.value = 0;
}


// alternately play or pause upon button click
function playPause() {
    if (!is_playing) {
        playTrack();
    } else {
        pauseTrack();
    }
}

// play current track and swap button icon
function playTrack() {
    curr_track.play();
    is_playing = true;
    play_button.innerHTML = '<i class="fa fa-pause-circle fa-3x"></i>';
}

// pause current track and swap button icon
function pauseTrack() {
    curr_track.pause();
    is_playing = false;
    play_button.innerHTML = '<i class="fa fa-play-circle fa-3x"></i>';
}

// skip to next track and play
function nextTrack() {
    chap_index += 1;
    play_next = true;

    let old_book_index = book_index;
    if (chap_index >= books[book_index]["chapters"]) {
        book_index += 1;
        chap_index = 0;
        if (book_index >= books.length) {
            book_index = 0;
            play_next = false;
        }
    }

    if (old_book_index != book_index) {
        changeHighlight(old_book_index, book_index);
    }

    loadTrack();
    if (play_next) {
        playTrack();
    } else {
        pauseTrack();
    }
}

// go to prev track if within first 2 seconds, otherwise reload current track
function prevTrack() {
    let old_book_index = book_index;
    if (curr_track.currentTime < 2) {
        chap_index -= 1;
        if (chap_index < 0) {
            book_index -= 1;
            if (book_index < 0) {
                book_index = books.length - 1;
            }
            chap_index = books[book_index]["chapters"] - 1;
        }
    }

    if (old_book_index != book_index) {
        changeHighlight(old_book_index, book_index);
    }

    loadTrack();
    playTrack();
}


/* seek slider and skip ahead/back functions */

// on slider input change, update current track time to proportional position on slider
function seekSlider() {
    curr_track.currentTime = curr_track.duration * (slider.value / 1000);
    updateSlider();
}

// increase time by 10 seconds and immediately update time
function skipAhead() {
    curr_track.currentTime += 10;
    updateSlider();
}

// decrease time by 10 seconds and immediately update time
function skipBack() {
    curr_track.currentTime -= 10;
    updateSlider();
}

// update slider position and time
function updateSlider() {
    if (isNaN(curr_track.duration)) {
        return;
    }

    storePosition();
    slider.value = curr_track.currentTime * (1000 / curr_track.duration);

    // note: audio.duration in firefox depends on loaded buffer, may increase near end of track
    let curr_min = Math.floor(curr_track.currentTime / 60);
    let curr_sec = Math.floor(curr_track.currentTime % 60);
    let total_min = Math.floor(curr_track.duration / 60);
    let total_sec = Math.floor(curr_track.duration % 60);

    // format min:sec with leading 0
    curr_time.textContent = ("00" + curr_min).slice(-2) + ":" + ("00" + curr_sec).slice(-2);
    total_time.textContent = ("00" + total_min).slice(-2) + ":" + ("00" + total_sec).slice(-2);
}

// save current position in local storage
function storePosition() {
    localStorage[book_field] = book_index;
    localStorage[chap_field] = chap_index;
    localStorage[time_field] = curr_track.currentTime;
}


/* on keyboard press events */

// on space key, play/pause
// on left arrow key, skip back
// on right arrow key, skip ahead
document.addEventListener("keydown", event => {
    if (event.code === "Space") {
        event.preventDefault();
        playPause();
    } else if (event.code === "ArrowLeft") {
        skipBack();
    } else if (event.code === "ArrowRight") {
        skipAhead();
    }
})


/* manage list of books */

// add books as html list elements
function populateBooks() {
    for (var i = 0; i < books.length; i++) {
        let li = document.createElement("li");
        li.dataset.index = i;
        li.className = "track-container book track";

        let button = document.createElement("i");
        button.className = "fa fa-play";
        li.appendChild(button);

        // let img = document.createElement("img");
        // img.dataset.index = i;
        // img.src = getCover(i);
        // img.className = "photo book-photo";
        // li.appendChild(img);

        let p = document.createElement("p");
        p.dataset.index = i;
        p.innerText = books[i]["title"];
        p.className = "track-text";

        // used to change text color when switching books
        p.id = i.toString();
        if (i == book_index) {
            p.style.color = highlight;
        }
        li.appendChild(p);

        book_tracks.appendChild(li);
    }
}

// unhighlight old book at index i, highlight next book at index j
function changeHighlight(i, j) {
    let title = document.getElementById(i.toString());
    title.style.color = "white";

    title = document.getElementById(j.toString());
    title.style.color = highlight;
}

// on book click, switch to book
document.addEventListener("click", function(e) {
    if (e.target && !isNaN(e.target.dataset.index)) {

        // if html element contains an index in book range
        let i = Number(e.target.dataset.index);
        if (i >= 0 && i < books.length && i != book_index) {
            changeHighlight(book_index, i);
            book_index = i;
            chap_index = 0;

            loadTrack();
            playTrack();
        }
    }
});
