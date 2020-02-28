addEventListener('load', fetchData());

function fetchData(){
  console.log("hi");
  var q = new XMLHttpRequest();
  q.onreadystatechange = receive;
  q.open("GET", "/banks", true);
  q.send();
}

function receive(){
  if (this.readyState != XMLHttpRequest.DONE) return;
  var list = JSON.parse(this.responseText);
  console.log(list);
  //var html = "<li>" + list.  ;
  //var ul = document.querySelector("#banklist");
  //ul.innerHTML = html;
  $(function() {
    //create Tabulator on DOM element with id "banktable"
    $("#banktable").tabulator({
      //height: "320px",
      fitColumns: true,
      columns: [
        { title: "Name", field: "name", sorter: "string", width: 150 },
        {
          title: "Location",
          field: "location",
          sorter: "string",
          align: "center"
        },
        {
          title: "Category of Bank",
          field: "category",
          sorter: "string"
        },
        {
          title: "Number of Empolyees",
          field: "size_employee",
          sorter: "number",
          formatter: "progress"
        },
        {
          title: "Year 1 Salary",
          field: "salary",
          sorter:"number"
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