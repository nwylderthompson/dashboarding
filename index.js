$(document).ready(function() {
	get().done(function(data){
		_.each(data.results[0].$properties, function(data, name){
			if (name != "$last_seen" && name != "$predict_grade"){
				_.each(data, function(graphData){
					loadChart(graphData);
				})
			}
		})
	})
	initializeMixpanel()
	$("#overlay").click(function(){
		if ($("#modal").css("display") != "none") {
			$("#modal").toggle();
			$("#overlay").toggle();
		}
	});
	$('#addReport').click(function(){
		$('#modal').toggle();
		$('#overlay').toggle();	
	});
	$('#saveDash').click(function(){
		$(this).css({"background-color":"#647997"})
		var dashboardData = {test:[]};
		_.each($('#dashboard').children(), function(report){
			var reportData = {};
			reportData.query = atob(report.dataset.report);
			reportData.position = $("#" + report.id).position()
			reportData.dimensions = {height:$("#" + report.id).height(), width:$("#" + report.id).width()}
			dashboardData.test.push(reportData);
		});
		Mixpanels.people_set(dashboardData, 'dashboardprofile')
	});
	$('#createSeg').click(function(){
		$('#segBuilder').toggle();
		MP.api.topEvents().done(function(data){
			if ($('#eventOptions option').size() == 1){
				_.each(data.values(), function(eventName, key){
					$('<option>'+eventName+'</option>').appendTo('#eventOptions');
				});
			}
		});
	});
	$('#eventOptions').change(function(){
		var eventName = $( "#eventOptions option:selected" ).text()
		if ($(".propSelector").css("display") == "none") {
			$('.propSelector').toggle();
		}
		$('#propOptions').find('option').remove().end().append('<option selected="selected" value="placeholder">Properties</option>').val('placeholder');
		MP.api.topProperties(eventName).done(function(data){
			_.each(data.values(), function(value, propName){
				$('<option>'+propName+'</option>').appendTo('#propOptions');
			});
		});
	});
	$('.toggle').click(function(){
		$('.toggleBox-selected').addClass('toggleBox').removeClass('toggleBox-selected');
		$(this).removeClass('toggleBox').addClass('toggleBox-selected');
	});
	$('#runQuery').click(function(){
		var eventName = $( "#eventOptions option:selected" ).text();
		var reportName = $('.textField').val();
		var chartType = $('.toggleBox-selected').text().toLowerCase();
		if (chartType == "bar"){
			chartType = "column";
		}
		if ($("#propOptions").val() != "placeholder"){
			var propName = $( "#propOptions option:selected" ).text();
		} else {
			var propName = false;
		}
		segmentQueryBuild(chartType, reportName, eventName, propName);
		$('#modal').toggle();
		$('#overlay').toggle();
		$('.propSelector').toggle();
		$('#segBuilder').toggle();
		$('#eventOptions').prop('selectedIndex',0);
		$('#propOptions').prop('selectedIndex',0);
		$('.textField').val('');
		$('#saveDash').css({"background-color":"#3f516b"})
	})
});

function initializeMixpanel(){
	Mixpanels = new Mixpanel("mobilegaming", MP.api.apiSecret)
}

function segmentQueryBuild(chartType, name, eventName, propName, params){
	if (propName){
		var title = propName;
	} else {
		var title = eventName;
	}
	var reportParams = {params:{event:eventName, on:propName, params:params}, chartType:chartType, name:name}
	Mixpanels.segment(eventName, propName, params).done(function(data){
		Chart(name, data, chartType, reportParams, title);
	});
}

function Chart(name, data, chartType, reportParams, title){
	var results = processChartData(chartType, data, title)
	var series = results[0];
	var xAxis = results[1];
	reportParams = btoa(JSON.stringify(reportParams));
	var containerID = "container_" + new Date().getTime().toString()
	var containerDiv = $("<div class='container' data-report=" + reportParams + " id=" + containerID + "></div>").appendTo('#dashboard');
	var graphID = "graph_" + new Date().getTime().toString()
	var graphDiv = $('<div class="graph" id=' + graphID + '></div>').appendTo('#'+containerID);
	$('<div class="delete"><img class="deleteImage" src="images/delete.png"/></div>').appendTo('#'+containerID);
	$('.delete').click(function(){
		$(this).parent().remove()
		$('#saveDash').css({"background-color":"#3f516b"})
	});
	drawChart(xAxis, series, name, chartType, graphID, containerID, title);
}

function loadChart(graphData){
	queryParams = JSON.parse(graphData.query);
	var reportParams = btoa(JSON.stringify(queryParams));
	var containerID = "container_" + new Date().getTime().toString();
	var containerDiv = $("<div class='container' data-report=" + reportParams + " id=" + containerID + "></div>").appendTo('#dashboard');
	$("#"+containerID).css(graphData.position);
	$("#"+containerID).width(graphData.dimensions.width);
	$("#"+containerID).height(graphData.dimensions.height);
	var eventName = queryParams.params.event;
	var propName = queryParams.params.on;
	if (propName){
		var title = propName;
	} else {
		var title = eventName;
	}
	var selector = queryParams.params.selector || false;
	var chartType = queryParams.chartType;
	var name = queryParams.name;
	var graphID = "graph_" + new Date().getTime().toString();
	var graphDiv = $('<div class="graph" id=' + graphID + '></div>').appendTo('#'+containerID);
	$('<div class="delete"><img class="deleteImage" src="images/delete.png"/></div>').appendTo('#'+containerID);
	$('.delete').click(function(){
		$(this).parent().remove()
		$('#saveDash').css({"background-color":"#3f516b"})
	});
	Mixpanels.segment(eventName, propName, selector).done(function(data){
		results = processChartData(chartType, data, title)
		var series = results[0];
		var xAxis = results[1];
		drawChart(xAxis, series, name, chartType, graphID, containerID);
	});
}

function processChartData(chartType, data, title){
	var xAxis = {categories:[]};
	var series = [];
	var x = 0;
	if (chartType == "line"){
		_.each(data.data.series, function(value, key){
			xAxis.categories.push(value)
		});
		_.each(data.data.values, function(values, segment){
			var current = {'name':segment, data:[]};
			_.each(xAxis.categories, function(value, key){
				current.data.push(values[value]);
			});
			x++
			if (x < 13){
				series.push(current)
			}
		})
	}
	if (chartType == "column"){
		xAxis.categories.push(title);
		_.each(data.data.values, function(values, segment){
			var current = {'name':segment, data:[]};
			var series_sum = 0
			_.each(values, function(value, date){
				series_sum += value;
			});
			current.data.push(series_sum)
			x++
			if (x < 13){
				series.push(current)
			}
		});
	}
	return [series, xAxis]
}

function drawChart(xAxis, series, name, chartType, graphID, containerID){
	var chart = new Highcharts.Chart({
					colors: ["#53a3eb", "#32BBBD", "#a28ccb", "#da7b80", "#2bb5e2", "#e8bc66", "#d390b6"],
					chart: {
						type: chartType,
						renderTo: graphID
					},
					title:{
						text:name
					},
					xAxis: xAxis,
					series: series
				})
	$("#" + containerID).draggable({
		start: function() {
			$('#saveDash').css({"background-color":"#3f516b"})
		},
		snap: true,
		containment: "#dashboard",
		cursor: "move",
		obstacle: ".container",
    	preventCollision: true,
	}).resizable({
		containment: "#dashboard",
		resize: function () {
			chart.setSize(
			this.offsetWidth,
			this.offsetHeight,
			false
			);
			$('#saveDash').css({"background-color":"#3f516b"})
		},
	});
}


function get() {
        return MP.api.query('/api/2.0/engage', {'distinct_id': "dashboardprofile"})
      }
