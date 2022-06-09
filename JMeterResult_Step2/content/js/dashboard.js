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

    var data = {"OkPercent": 95.28013285551962, "KoPercent": 4.719867144480378};
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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.7888733502316231, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.5462073931829092, 500, 1500, "MQTT Connect "], "isController": false}, {"data": [0.8514431239388794, 500, 1500, "MQTT DisConnect"], "isController": false}, {"data": [1.0, 500, 1500, "MQTT Sub Sampler"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 11441, 540, 4.719867144480378, 911.4620225504772, 0, 10037, 29.0, 3532.400000000014, 5497.9, 8950.64, 658.3232637090741, 8.31513833146326, 0.0], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["MQTT Connect ", 4166, 424, 10.177628420547288, 1968.8761401824322, 13, 10037, 217.0, 5959.800000000001, 8177.249999999998, 10005.0, 239.72839222004833, 3.6235874741051903, 0.0], "isController": false}, {"data": ["MQTT DisConnect", 3534, 116, 3.2823995472552348, 629.7959818902078, 9, 9658, 26.0, 3058.0, 5015.25, 5977.550000000001, 228.57512450682364, 2.8950110358320935, 0.0], "isController": false}, {"data": ["MQTT Sub Sampler", 3741, 0, 0.0, 0.0, 0, 0, 0.0, 0.0, 0.0, 0.0, 241.4171399070728, 2.373407351090604, 0.0], "isController": false}]}, function(index, item){
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
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_69e3857280874770bea'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_5d77178eac4d46fcb40'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_9be4c59eac744658ae4'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_77f823b9680043ec8c4'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_c555e323e7d447979ad'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_18e6b8ed9c3a46fcb0a'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_ea486d7a650044baa4e'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_e53e684c879f46f7ba7'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_cea155087c954776b06'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_39aa9d82bee64e5eb83'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_321c3ecaa85c4564805'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_e07f3aa3e195467fa87'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_1afa435c766f40aa842'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_58aa28e291b8415b8c6'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_62180ba2fa32429f884'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_09044f6c97cc4b6b8cd'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_1b5acac950e24b48863'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_9038429445a649659bc'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_d225e3f75cd7454d8be'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_5903200715734c88855'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_af989aaed6c2467096a'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_1e54287d9d5d409eae0'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_e6776f6fcf404250adc'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_6efbea8ff9044c63ace'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_25fb2131af044de1b43'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_62ecc6423f3940a1b0a'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_93cf4408f3a74497a44'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_5072a51f0bbf4e61bc1'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_ebde91c87f884c06b79'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_732c970d660c41f18ca'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_c4d309d2ec804659b47'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_662a94cd5fb943cba68'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_db5b56ba3ed6472caf6'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_b7d4fdeb19a24b58ba9'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_c31801fce2ac44daae8'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_a7ab50a0311a4498a93'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_895c4954cd80414aa55'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_c355a9af4a81472bb0c'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_befa9feef7fd498887c'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_e68c21f6eb084db1b01'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_752228fa14ea440e926'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_d3ab7979f43c44d0b02'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_17cb219519ea4a6bb1e'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_1e3b31c4bf73413d827'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_3564ec48e9094bc6ad0'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_00c77696ab0e4636aa2'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_3d1d9ffb6c924ac9ae6'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_9e68991a333e45fe9d1'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_b04ee82be2904ef5b54'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_e6de022ca3df4e41a8e'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_aa8d5ed122344cb596b'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_d8181fe1f3134dccb75'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_08363d81d9b64b93a99'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_bcafa507371342e8b3a'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_549cb8c0f2d94b359d3'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_85bc8b83d8d745f0bf4'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_28dad65a53464975a0d'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_7fa22150b07d4a709bf'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_10ac3bd02d66492cbe6'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_3deeb1c58aa74e16b22'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_6ef4c9a37cfc4b58845'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_75a9958342f84c58be3'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_54e6d3fe8c864d1589b'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_080689418f184655b61'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_0008e7799d944f63b8f'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_3035bd3f0a914eb78c4'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_933eb5eb2d814b26bee'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_be16431fa2d64515be4'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_f844b8ad28f44418bf8'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_facf0571716d4151a51'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_908d1f0d4f6e4486829'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_ea43faa4e4224a0a9a1'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_5332859af0c0474ba43'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_c2d726c4e2824163b3c'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_7b431dfcac8e48148f9'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_8c494e33f01348bf8bb'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_16311c28b472436088f'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_ea5a06ffdd6f48438bb'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_9937dbf0235441e1b94'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_d99233d3861849b3a77'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_2acc30b112564318985'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_a19f95b300c4427fa3d'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_249de2cb58ee423d803'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_a1928faef63e4c83aef'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_a32fcde9242f4d98a6a'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_96dd355da8c84681a4a'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_cfc2a7cda4774198847'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_5e5592cb350242f18a0'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_9d4bbf3f1b4342c58ad'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_72f247f4d1cc49e0833'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_2406d16749f44b7290b'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_d8e5f30abc3c476bb78'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_8524f51672ef4bfe86e'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_cdb7518a4c8240bd85e'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_aecde549f2b44609bbb'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_05d323b2b3e844c9913'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_5e3d921ab1cb4f34b22'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_b10d96e1c55841a0b0a'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_ff285141603647ea9ce'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_77c553280e6d45a79f2'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_b2db1392b8734e13aa7'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_733543da3f8841ad86d'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["502/Failed to establish Connection null.", 424, 78.51851851851852, 3.7059697578882966], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_971f9f9c322040c3bca'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_b9de605a967e482d9e1'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_35ea7deb48054253a2e'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_babfdcdc01eb47bb8d0'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_f372e9b0f28e465bafc'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_910b8731155d4a379f5'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_72e3811aff6b4445b96'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_40e0048ea4a44d12b5a'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_7bcb11dd62d3483892e'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_40fd92fc7fec496dbf1'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_3641af3313754854838'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_da8e65d974e441c8873'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_1c26d48271be4b9f83c'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}, {"data": ["501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_c7995ce96cad476eb53'}.", 1, 0.18518518518518517, 0.0087404947120007], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 11441, 540, "502/Failed to establish Connection null.", 424, "501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_69e3857280874770bea'}.", 1, "501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_5d77178eac4d46fcb40'}.", 1, "501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_9be4c59eac744658ae4'}.", 1, "501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_77f823b9680043ec8c4'}.", 1], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": ["MQTT Connect ", 4166, 424, "502/Failed to establish Connection null.", 424, null, null, null, null, null, null, null, null], "isController": false}, {"data": ["MQTT DisConnect", 3534, 116, "501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_69e3857280874770bea'}.", 1, "501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_5d77178eac4d46fcb40'}.", 1, "501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_9be4c59eac744658ae4'}.", 1, "501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_77f823b9680043ec8c4'}.", 1, "501/Failed to disconnect Connection HiveMQTTConnection{clientId='cid_c555e323e7d447979ad'}.", 1], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
