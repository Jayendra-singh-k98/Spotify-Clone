console.log("Let's write JavaScript");

let currentSong = new Audio(); // Initialize an Audio object to keep track of the currently playing song
let currFolder;
let songs = [];

async function fetchSongs(folder) {
    currFolder = folder;

    try {
        let response = await fetch(`/${folder}/`);
        let htmlText = await response.text();

        // Create a temporary div to parse the HTML response
        let div = document.createElement("div");
        div.innerHTML = htmlText;

        // Get links to the songs
        let anchors = div.getElementsByTagName("a");
        songs = [];
        for (let anchor of anchors) {
            if (anchor.href.endsWith(".mp3")) {
                songs.push(anchor.href.split(`/${folder}/`)[1]);
            }
        }

        


        // Update the song list UI
        let songUL = document.querySelector(".songList ul");
        songUL.innerHTML = ""; // Clear the list before adding
        for (let song of songs) {
            songUL.innerHTML += `
                <li>
                    <img class="invert" src="img/music.svg" alt="Music Icon">
                    <div class="info">
                        <div>${song.replaceAll("%20", " ").split(".mp3")[0]}</div>
                        <div>${folder.replaceAll("%20"," ").split("/")[1]}</div>
                    </div>
                    <div class="playnow">
                        <span>Play Now</span>
                        <img src="img/play.svg" alt="Play Icon">
                    </div>
                </li>`;
        }

        // Add event listeners to the list items
        let listItems = document.querySelectorAll(".songList li");
        listItems.forEach((item, index) => {
            item.addEventListener("click", () => {
                playMusic(songs[index]); // Correctly call the playMusic function
            });
        });
    } catch (error) {
        console.error("Error fetching songs:", error);
    }
    return songs;
}

const playMusic = (track, pause = false) => {
    // Stop the currently playing song if there is one
    if (!currentSong.paused) {
        currentSong.pause();
        currentSong.currentTime = 0; // Reset the playback time
    }

    // Set the source to the new track and play it
    currentSong.src = `/${currFolder}/` + track;
    if (!pause) {
        currentSong.play();
        document.querySelector("#play").src = "img/pause.svg";
    }

    // Update the UI with the song info
    document.querySelector(".songinfo").textContent = decodeURIComponent(track);
    document.querySelector(".songtime").textContent = "00:00 / 00:00";
    
    // Add an event listener to the song ending
    currentSong.addEventListener("ended", () => {
        let currentIndex = songs.indexOf(track);
        let nextIndex = (currentIndex + 1) % songs.length; // Loop back to the first song if at the end
        playMusic(songs[nextIndex]);
    });
};

function secondsToMinuteSeconds(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

async function displayAlbums() {
   
        let a = await fetch(`/songs/`);
        let response = await a.text();
        
        // Create a temporary div to parse the HTML response
        let div = document.createElement("div");
        div.innerHTML = response;
        let anchors = div.getElementsByTagName("a");
        let cardContainer = document.querySelector(".cardContainer");
        
        Array.from(anchors).forEach(async e => {
            if (e.href.includes("/songs")) {
                let folder = e.href.split("/").slice(-2)[1];
                // Get the metadata of the folder
                let a = await fetch(`/songs/${folder}/info.json`);
                let albumInfo = await a.json();
                cardContainer.innerHTML = cardContainer.innerHTML + `
                    <div data-folder="${folder}" class="card">
                        <div class="play">
                            <svg data-encore-id="icon" role="img" aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" class="Svg-sc-ytk21e-0 bneLcE">
                                <path d="M7.05 3.606L20.54 11.394a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z" fill="black"></path>
                            </svg>
                        </div>
                        <img src="/songs/${folder}/cover.jpg" alt="Album Cover">
                        <h3>${albumInfo.title}</h3>
                        <p>${albumInfo.Description}</p>
                    </div>`;
            }
        })
       // Handle card click events to load new playlists
    document.querySelector(".cardContainer").addEventListener("click", async (e) => {
        if (e.target.closest(".card")) {
            let folder = e.target.closest(".card").dataset.folder;
            await fetchSongs(`songs/${folder}`);
            playMusic(songs[0]);
        }
    });
}

async function main() {
    // Fetch and display the first song list
    await fetchSongs("songs/ncs");
    playMusic(songs[0], true);

    // Display all albums
    displayAlbums();

    // Attach event listener to play/pause button
    let playButton = document.querySelector("#play");
    playButton.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            playButton.src = "img/pause.svg";
        } else {
            currentSong.pause();
            playButton.src = "img/play.svg";
        }
    });

    // Update song time and seekbar during playback
    currentSong.addEventListener("timeupdate", () => {
        let currentTime = currentSong.currentTime;
        let duration = currentSong.duration;

        document.querySelector(".songtime").textContent = `${secondsToMinuteSeconds(currentTime)} / ${secondsToMinuteSeconds(duration)}`;
        document.querySelector(".circle").style.left = `${(currentTime / duration) * 100}%`;
        document.querySelector(".seekbar .progress").style.width = `${(currentTime / duration) * 100}%`;
    });

    // Seekbar functionality
    document.querySelector(".seekbar").addEventListener("click", (e) => {
        let seekbarWidth = e.target.getBoundingClientRect().width;
        let clickPosition = e.offsetX;
        let seekTime = (clickPosition / seekbarWidth) * currentSong.duration;
        currentSong.currentTime = seekTime;
    });

    previous.addEventListener("click", () => {
        currentSong.pause()
        console.log("Previous clicked")
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0])
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1])
        }
    })

    // Add an event listener to next
    next.addEventListener("click", () => {
        currentSong.pause()
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0])
        if((index +1)%songs.length == 0){
            playMusic(songs[0])
        }
        else{
            playMusic(songs[index + 1])
        }
    })

    // Volume control
    document.querySelector(".range input").addEventListener("input", (e) => {
        currentSong.volume = e.target.value / 100;
    });

    
    //add event listener to the hamburger
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0"
    })
    //add event listener to the close button
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-140%"
    })


     // Add event listener to mute the track
     document.querySelector(".volume>img").addEventListener("click", e=>{ 
        if(e.target.src.includes("img/volume.svg")){
            e.target.src = e.target.src.replace("img/volume.svg", "img/mute.svg")
            currentSong.volume = 0;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
        }
        else{
            e.target.src = e.target.src.replace("img/mute.svg", "img/volume.svg")
            currentSong.volume = .10;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 30;
        }

    })
    //add event listener to play music autoplay all song of a card
   
}

main();
