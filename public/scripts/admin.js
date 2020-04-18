document.querySelectorAll(".tabs").forEach(function (elem) {
  tabParent = document.querySelector(".tabs");
  tabs = elem.querySelectorAll("li");
  contents = elem.nextElementSibling;
  contentsList = contents.querySelectorAll(".tab-content");

  tabs.forEach(function (elem2) {
    elem2.addEventListener("click", function () {
      curIndex = getNodeindex(elem2);

      for (var i = 0; i < 3; i++) {
        tabs[i].classList.remove("is-active");
        contentsList[i].classList.remove("is-active");
      }

      contentsList[curIndex].classList.add("is-active");
      elem2.classList.add("is-active");
    });
  });
});

function getNodeindex(elm) {
  return [...elm.parentNode.children].indexOf(elm);
}
