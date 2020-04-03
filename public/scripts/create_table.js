addEventListener("load", fetchData());
var list;

function fetchData() {
  var q = new XMLHttpRequest();
  q.onreadystatechange = receive;
  q.open("GET", "/banks", true);
  q.send();
}

function receive() {
  if (this.readyState != XMLHttpRequest.DONE) return;
  list = JSON.parse(this.responseText);
  console.log(list);
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
