$(document).ready(function () {
  function normalize(str) {
    return String(str || "").toLowerCase().trim();
  }

  var lastTrucks = [];

  function loadTrucks() {
    $.ajax({
      type: "GET",
      url: "/api/v1/trucks/view",
      success: function (trucks) {
        lastTrucks = trucks || [];
        renderTrucks(lastTrucks);
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
          ? '<span class="app-pill success">Open</span>'
          : '<span class="app-pill neutral">Closed</span>';

      const $col = $("<div class='col-sm-4'></div>");
      const $panel = $("<div class='app-card' style='margin-bottom:18px;'></div>");
      const $heading = $("<div class='app-card-header'></div>").append(
        $("<h3 class='app-card-title' style='font-size:18px;'></h3>").text(name)
      );
      const $body = $("<div class='app-card-body'></div>");

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

      $body.append($("<div class='app-actions' style='justify-content:flex-start;'></div>").append($btn));

      $panel.append($heading).append($body);
      $col.append($panel);
      $list.append($col);
    });
  }

  $("#truckSearch").on("input", function () {
    var q = normalize($(this).val());
    if (!q) {
      renderTrucks(lastTrucks);
      return;
    }
    var filtered = lastTrucks.filter(function (t) {
      var name = t.truckName || t.name || "";
      return normalize(name).includes(q);
    });
    renderTrucks(filtered);
  });

  loadTrucks();
});


