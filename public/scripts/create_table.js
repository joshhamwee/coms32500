const input = document.getElementById("search");
input.addEventListener("input", fetchSearch);

addEventListener("load", fetchData());

var list;
function fetchData() {
  var q = new XMLHttpRequest();
  q.onreadystatechange = receive;
  q.open("GET", "/banks", true);
  q.send();
}

function fetchSearch(e) {
  if (e.target.value == "") {
    fetchData();
  } else {
    var q = new XMLHttpRequest();
    var query = "/search=" + e.target.value;
    console.log(query);
    q.onreadystatechange = receive;
    q.open("GET", query, true);
    q.send();
  }
}

function receive() {
  if (this.readyState != XMLHttpRequest.DONE) return;
  list = JSON.parse(this.responseText);
  if (list.length == 0) {
    input.classList.add("is-danger");
  }
  if (list.length < 26) {
    input.classList.add("is-success");
  } else {
    input.classList.remove("is-danger");
    input.classList.remove("is-success");
  }
  table();
}

function table() {
  if (window.innerWidth < 750) {
    $(function() {
      //create Tabulator on DOM element with id "banktable"
      $("#banktable").tabulator({
        //height: "320px",
        fitColumns: true,
        columns: [
          { title: "Name", field: "name", sorter: "string" },
          {
            title: "Category of Bank",
            field: "category",
            sorter: "string"
          },
          {
            title: "Number of Empolyees",
            field: "size_employee",
            sorter: "number",
            formatter: "plaintext"
          }
        ],
        rowClick: function(e, id, data, row) {
          var url = "bank.html?id=" + id;
          window.location.href = url;
        }
      });
      //define some sample data
      var tabledata = list;
      //load sample data into the table
      $("#banktable").tabulator("setData", tabledata);
    });
  } else {
    $(function() {
      //create Tabulator on DOM element with id "banktable"
      $("#banktable").tabulator({
        //height: "320px",
        fitColumns: true,
        columns: [
          { title: "Name", field: "name", sorter: "string" },
          {
            title: "Category of Bank",
            field: "category",
            sorter: "string"
          },
          {
            title: "Number of Empolyees",
            field: "size_employee",
            sorter: "number",
            formatter: "plaintext"
          },
          {
            title: "Year 1 Salary",
            field: "y1_salary",
            formatter: "money",
            sorter: "number"
          },

          {
            title: "Job Competitiveness",
            field: "competitive",
            formatter: "star",
            sorter: "number"
          }
        ],
        rowClick: function(e, id, data, row) {
          var url = "bank.html?id=" + id;
          window.location.href = url;
        }
      });
      //define some sample data
      var tabledata = list;
      //load sample data into the table
      $("#banktable").tabulator("setData", tabledata);
    });
  }
}
$(window).on("resize", function() {
  table();
  $(".tabulator").tabulator("redraw");
});
// window.onresize = function() {
//   table();
//   console.log(window.innerWidth);
// };
