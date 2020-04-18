$(".tabs").each(function(index) {
  var $tabParent = $(this);
  var $tabs = $tabParent.find("li");
  var $contents = $tabParent.next(".tabs-content").find(".tab-content");

  $tabs.click(function() {
    var curIndex = $(this).index();
    // toggle tabs
    $tabs.removeClass("is-active");
    $tabs.eq(curIndex).addClass("is-active");
    // toggle contents
    $contents.removeClass("is-active");
    $contents.eq(curIndex).addClass("is-active");
  });
});
