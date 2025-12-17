$(document).ready(function () {
  function loadTrucks() {
    $.ajax({
      type: "GET",
      url: "/api/v1/trucks/view",
      success: function (trucks) {
        renderTrucks(trucks || []);
      },
      error: function (err) {
        console.log(err);
        if (typeof showNotification === "function") {
          showNotification("Failed to load trucks.", "danger");
        } else {
          alert("Failed to load trucks.");
        }
      },
    });
  }

  function renderTrucks(trucks) {
    const $noTrucks = $("#no-trucks");
    const $list = $("#trucks-list");
    $list.empty();

    if (!trucks.length) {
      $noTrucks.show();
      return;
    }

    $noTrucks.hide();

    trucks.forEach(function (truck) {
      const truckId = truck.truckId || truck.id;
      const name = truck.truckName || truck.name || "Food Truck";
      const status = truck.truckStatus || truck.status || "available";
      const orderStatus = truck.orderStatus || "available";

      const busyLabel =
        orderStatus === "available"
          ? '<span class="label label-success">Accepting Orders</span>'
          : '<span class="label label-default">Not Accepting Orders</span>';

      const $col = $("<div class='col-sm-4'></div>");
      const $panel = $("<div class='panel panel-default'></div>");
      const $heading = $("<div class='panel-heading'></div>").append(
        $("<h3 class='panel-title'></h3>").text(name)
      );
      const $body = $("<div class='panel-body'></div>");

      $body.append(
        $("<p></p>").html(
          "<strong>Status:</strong> " +
            (status === "available" ? "Available" : status)
        )
      );
      $body.append(
        $("<p></p>").html("<strong>Orders:</strong> " + busyLabel)
      );

      const $btn = $("<button class='btn btn-primary'>View Menu</button>");
      $btn.click(function () {
        window.location.href = "/trucks/" + encodeURIComponent(truckId) + "/menu";
      });

      $body.append($("<p></p>").append($btn));

      $panel.append($heading).append($body);
      $col.append($panel);
      $list.append($col);
    });
  }

  loadTrucks();
});


