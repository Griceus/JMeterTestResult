/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 99.21463263408081, "KoPercent": 0.7853673659191899};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.886070063036065, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.6905982905982906, 500, 1500, "MQTT Connect "], "isController": false}, {"data": [0.9939315924972416, 500, 1500, "MQTT DisConnect"], "isController": false}, {"data": [1.0, 500, 1500, "MQTT Sub Sampler"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 9677, 76, 0.7853673659191899, 702.9787124108703, 0, 10416, 30.0, 3043.0, 8364.2, 9905.439999999999, 866.2608539969564, 9.61229131232656, 0.0], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["MQTT Connect ", 3510, 62, 1.7663817663817665, 1904.943874643873, 8, 10416, 105.0, 9248.8, 9671.45, 10163.34, 314.2064273565482, 3.613744573001522, 0.0], "isController": false}, {"data": ["MQTT DisConnect", 2719, 14, 0.5148951820522251, 42.79955866127243, 1, 908, 30.0, 70.0, 89.0, 316.2000000000007, 286.8446038611668, 3.16787850116046, 0.0], "isController": false}, {"data": ["MQTT Sub Sampler", 3448, 0, 0.0, 0.0, 0, 0, 0.0, 0.0, 0.0, 0.0, 363.06201958513213, 3.8940134055491207, 0.0], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_08cc5e3a7b6f482785e'}.", 1, 1.3157894736842106, 0.010333781130515656], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_0d932fc5fd0648f4917'}.", 1, 1.3157894736842106, 0.010333781130515656], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_c2b5c072bf8d44d5bc2'}.", 1, 1.3157894736842106, 0.010333781130515656], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_9f793ceb21a2456e9a8'}.", 1, 1.3157894736842106, 0.010333781130515656], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_8e5462b8ff49462db95'}.", 1, 1.3157894736842106, 0.010333781130515656], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_b23635bc3ba94ffab56'}.", 1, 1.3157894736842106, 0.010333781130515656], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_9fca432060d04396bba'}.", 1, 1.3157894736842106, 0.010333781130515656], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_42b3cd768e5142ef89e'}.", 1, 1.3157894736842106, 0.010333781130515656], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_8bfe4f03f3a2458b9e8'}.", 1, 1.3157894736842106, 0.010333781130515656], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_f299d14c34a64186afd'}.", 1, 1.3157894736842106, 0.010333781130515656], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_c15e69bd9263449fb9e'}.", 1, 1.3157894736842106, 0.010333781130515656], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_18fcff4acdb94a64a5b'}.", 1, 1.3157894736842106, 0.010333781130515656], "isController": false}, {"data": ["502/Failed to establish Connection null.", 62, 81.57894736842105, 0.6406944300919707], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_d07473c745ba42b78b5'}.", 1, 1.3157894736842106, 0.010333781130515656], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_a681037c49ca47128f7'}.", 1, 1.3157894736842106, 0.010333781130515656], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 9677, 76, "502/Failed to establish Connection null.", 62, "501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_08cc5e3a7b6f482785e'}.", 1, "501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_0d932fc5fd0648f4917'}.", 1, "501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_c2b5c072bf8d44d5bc2'}.", 1, "501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_9f793ceb21a2456e9a8'}.", 1], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": ["MQTT Connect ", 3510, 62, "502/Failed to establish Connection null.", 62, null, null, null, null, null, null, null, null], "isController": false}, {"data": ["MQTT DisConnect", 2719, 14, "501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_08cc5e3a7b6f482785e'}.", 1, "501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_0d932fc5fd0648f4917'}.", 1, "501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_c2b5c072bf8d44d5bc2'}.", 1, "501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_9f793ceb21a2456e9a8'}.", 1, "501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_8e5462b8ff49462db95'}.", 1], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
