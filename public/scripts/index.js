document.querySelectorAll(".modal-button").forEach(function(element) {
  element.addEventListener("click", function() {
    var target = document.querySelector(element.getAttribute("data-target"));

    target.classList.add("is-active");

    target.querySelector(".modal-close").addEventListener("click", function() {
      target.classList.remove("is-active");
    });
  });
});
