var imageContainer = document.getElementById("imageContainer");
var image = document.getElementById("image");
var imageDownloadLink = document.getElementById("imageDownloadLink");
var screenShotBtn = document.getElementById("screenShotBtn");
var fullScreenShotBtn = document.getElementById("fullScreenShotBtn");

var xhr = new XMLHttpRequest();

function loadImage() {    
    xhr.open("GET", "/shot.png");
    xhr.onload = () => {
        imageContainer.style.display = "grid";
        image.src = "";
        image.src = "/shot.png";
    }
    xhr.send();
}

screenShotBtn.addEventListener("click", (e) => {
    xhr.open("GET", "/screenshot");
    xhr.onload = loadImage;
    xhr.send();
});

fullScreenShotBtn.addEventListener("click", (e) => {
    xhr.open("GET", "/fullscreenshot");
    xhr.onload = loadImage;
    xhr.send();
});