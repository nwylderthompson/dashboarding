var token = "mobilegaming"

$(document).ready(function() {
	reloadCharts();
	initializeMixpanel()
	$('#fromDatePicker').datepicker({
	    onSelect: function(dateText, inst) {
	      $("#fromDateText").text(returnDateText(dateText));
	      $("#fromDate").val(moment(dateText).format("YYYY-MM-DD"));
	      if ($("#fromDate").val() > $("#toDate").val()) {
	      	if (moment($("#fromDate").val()).add(7, 'days') > moment()){
	      		$("#toDateText").text(returnDateText(moment()));
	      		$("#toDate").val(moment().format("YYYY-MM-DD"));
	      		$("#toDatePicker").val(moment().format("MM/DD/YYYY"))
	      	} else {
	      		$("#toDateText").text(returnDateText(moment($("#fromDate").val()).add(7, 'days')));
	      		$("#toDate").val(moment($("#fromDate").val()).add(7, 'days').format("YYYY-MM-DD"));
	      		$("#toDatePicker").val(moment($("#fromDate").val()).add(7, 'days').format("MM/DD/YYYY"))
	      	}	
	      }
	      $('#saveDash').css({"background-color":"#3f516b", "cursor":"pointer"});
	      $("#dashboard").empty();
	      reloadCharts($("#fromDate").val(), $("#toDate").val());
    	},
    	maxDate: "+0D"
    });
	$('#toDatePicker').datepicker({
	    onSelect: function(dateText, inst) {
	      $('#toDateText').text(returnDateText(dateText));
	      $("#toDate").val(moment(dateText).format("YYYY-MM-DD"));
	      if ($("#fromDate").val() > $("#toDate").val()) {
	      	$("#fromDateText").text(returnDateText(moment($("#toDate").val()).subtract(7, 'days')));
	      	$("#fromDate").val(moment($("#toDate").val()).subtract(7, 'days').format("YYYY-MM-DD"));
	      	$("#fromDatePicker").val(moment($("#toDate").val()).subtract(7, 'days').format("MM/DD/YYYY"))
	      }
	      $('#saveDash').css({"background-color":"#3f516b", "cursor":"pointer"});
	      $("#dashboard").empty();
	      reloadCharts($("#fromDate").val(), $("#toDate").val());
    	},
    	maxDate: "+0D"
	});

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
	$('#saveDash').click(
		function(){
			$(this).css({"background-color":"#647997", "cursor":"default"})
			var dashboardData = {test:[]};
			_.each($('#dashboard').children(), function(report){
				var reportData = {};
				reportData.query = JSON.parse(atob(report.dataset.report));
				reportData.query.params.params.to_date = $("#toDate").val()
				reportData.query.params.params.from_date = $("#fromDate").val()
				reportData.position = $("#" + report.id).position()
				reportData.dimensions = {height:$("#" + report.id).height(), width:$("#" + report.id).width()}
				dashboardData.test.push(reportData);
			});
			Mixpanels.people_set(dashboardData, 'dashboardprofile')
		}
	);
	$('.modalElement').click(function(){
		if ($(this).find(".modalDisplay").attr('id') == 'createSeg'){
			$('#segBuilder').toggle();
			if ($(".segSelector").css("display") != "none") {
				$('.segSelector').toggle();
			}
			if ($('#bookmarksBuilder').css("display") != "none") {
				$('#bookmarksBuilder').toggle();
			}
			if ($("#funnelBuilder").css("display") != "none") {
				$('#funnelBuilder').toggle();
			}
			$('#eventOptions').prop('selectedIndex',0);
			$('#propOptions').prop('selectedIndex',0);
			if ($('#eventOptions option').size() == 1){
				MP.api.topEvents().done(function(data){
					_.each(data.values(), function(eventName, key){
						$('<option value="'+ eventName +'">'+eventName+'</option>').appendTo('#eventOptions');
					});
					customEvent().done(function(events){
						_.each(events.custom_events, function(values){
							var eventName = values.name
							var eventValue = "$custom_event:" + values.id
							$('<option value="'+ eventValue +'">'+eventName+'</option>').appendTo('#eventOptions');
						})
					})
				});
			}
			$('#eventOptions').select2();
		}
		if ($(this).find(".modalDisplay").attr('id') == 'createRet'){
			$('#bookmarksBuilder').toggle();
			if ($("#segBuilder").css("display") != "none") {
				$('#segBuilder').toggle();
			}
			if ($("#funnelBuilder").css("display") != "none") {
				$('#funnelBuilder').toggle();
			}
		}
		if ($(this).find(".modalDisplay").attr('id') == 'createFun'){
			$('#funnelBuilder').toggle();
			$('#funnelOptions').select2();
			if ($("#segBuilder").css("display") != "none") {
				$('#segBuilder').toggle();
			}
			if ($('#bookmarksBuilder').css("display") != "none") {
				$('#bookmarksBuilder').toggle();
			}
			if ($('#funnelOptions option').size() == 1){
				getFunnels().done(function(data){
					if ($('#funnelOptions option').size() == 1){
						_.each(data, function(funnel){
							var funnel_id = funnel.funnel_id
							var funnel_name = funnel.name
							$('<option value="'+ funnel_id +'">'+funnel_name+'</option>').appendTo('#funnelOptions');
						});
					}
				})
			}
		}
	})
	$('#eventOptions').change(function(){
		var eventName = $( "#eventOptions option:selected" ).val()
		if ($(".segSelector").css("display") == "none") {
			$('.segSelector').toggle();
		}
		$('#propOptions').find('option').remove().end().append('<option selected="selected" value="placeholder">Properties</option>').val('placeholder');
		MP.api.topProperties(eventName).done(function(data){
			_.each(data.values(), function(value, propName){
				$('<option>'+propName+'</option>').appendTo('#propOptions');
			});
		});
		$('#propOptions').select2();
	});
	$('.toggle').click(function(){
		if ($(this).attr('class').indexOf('chartType') > 0){
			$('.toggleBox-selected.chartType').addClass('toggleBox').removeClass('toggleBox-selected');
		} else if ($(this).attr('class').indexOf('queryType') > 0){
			$('.toggleBox-selected.queryType').addClass('toggleBox').removeClass('toggleBox-selected');
		}
		$(this).removeClass('toggleBox').addClass('toggleBox-selected');
	});
	$('#runQuery').click(function(){
		var params = {'type':$('.toggleBox-selected.queryType').attr('value')};
		params.to_date = $("#toDate").val()
		params.from_date = $("#fromDate").val()
		var eventName = $( "#eventOptions option:selected" ).val();
		var eventTitle = $( "#eventOptions option:selected" ).text();
		var reportName = $('.textField').val();
		var chartType = $('.toggleBox-selected.chartType').attr('value');
		var propName = $( "#propOptions option:selected" ).text();
		if ($("#propOptions").val() == "placeholder"){
			propName = false;
		}
		if (!('to_date' in params) && chartType == 'column' && params.type == 'unique'){
			params.interval = 7;
		}
		segmentQueryBuild(chartType, reportName, eventName, propName, params, eventTitle);
		$('#modal').toggle();
		$('#overlay').toggle();
		$('.segSelector').toggle();
		$('#segBuilder').toggle();
		$('#eventOptions').prop('selectedIndex',0);
		$('#propOptions').prop('selectedIndex',0);
		$('.textField').val('');
		$('#saveDash').css({"background-color":"#3f516b", "cursor":"pointer"})
	})
});

function initializeMixpanel(){
	Mixpanels = new Mixpanel(token, MP.api.apiSecret)
}

function segmentQueryBuild(chartType, name, eventName, propName, params, eventTitle){
	if (propName){
		var title = propName;
	} else {
		var title = eventTitle;
	}
	var reportParams = {params:{event:eventName, on:propName, params:params}, chartType:chartType, name:name, eventTitle:eventTitle}
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
		$('#saveDash').css({"background-color":"#3f516b", "cursor":"pointer"})
	});
	drawChart(xAxis, series, name, chartType, graphID, containerID, title);
}

function loadChart(graphData){
	queryParams = graphData.query;
	var reportParams = btoa(JSON.stringify(queryParams));
	var containerID = "container_" + new Date().getTime().toString();
	var containerDiv = $("<div class='container' data-report=" + reportParams + " id=" + containerID + "></div>").appendTo('#dashboard');
	$("#"+containerID).css(graphData.position);
	$("#"+containerID).width(graphData.dimensions.width);
	$("#"+containerID).height(graphData.dimensions.height);
	var eventName = queryParams.params.event;
	var propName = queryParams.params.on;
	//for bar chart labeling
	if (propName){
		var title = propName;
	} else {
		var title = queryParams.eventTitle;
	}
	var params = queryParams.params.params
	params.to_date = moment(params.to_date).format('YYYY-MM-DD')
	params.from_date = moment(params.from_date).format('YYYY-MM-DD')
	var chartType = queryParams.chartType;
	var name = queryParams.name;
	var graphID = "graph_" + new Date().getTime().toString();
	var graphDiv = $('<div class="graph" id=' + graphID + '></div>').appendTo('#'+containerID);
	$('<div class="delete"><img class="deleteImage" src="images/delete.png"/></div>').appendTo('#'+containerID);
	$('.delete').click(function(){
		$(this).parent().remove()
		$('#saveDash').css({"background-color":"#3f516b", "cursor":"pointer"})
	});
	Mixpanels.segment(eventName, propName, params).done(function(data){
		results = processChartData(chartType, data, title)
		var series = results[0];
		var xAxis = results[1];
		drawChart(xAxis, series, name, chartType, graphID, containerID);
	});
}

function processChartData(chartType, data, title){
	var xAxis = {categories:[]};
	var dates = []
	var series = [];
	var x = 0;
	if (chartType == "line"){
		_.each(data.data.series, function(value, key){
			xAxis.categories.push(moment(value).format("MMM Do"))
			dates.push(value)
		});
		var output = data.data.values
		_.each(data.data.values, function(results, segment){
			var current = {'name':segment, data:[]};
			//for naming custom events
			if (Object.keys(output).length == 1){
				var current = {'name':title, data:[]};
			}
			_.each(dates, function(value, key){
				current.data.push(results[value]);
			});
			x++
			if (x < 13){
				series.push(current)
			}
		})
		var steps  = Math.ceil(xAxis.categories.length/6)
		xAxis.labels = {step:steps, staggerLines:1}
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
					series: series,
					yAxis: {
						min: 0
					}
				})
	$("#" + containerID).draggable({
		start: function() {
			$('#saveDash').css({"background-color":"#3f516b", "cursor":"pointer"})
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
			$('#saveDash').css({"background-color":"#3f516b", "cursor":"pointer"})
		},
	});
}

function returnDateText(date) {
	var result = moment(date).format('MMMM Do YYYY')
	if (result.length > 15) {
		result = moment(date).format('MMM Do YYYY')
	}
	return result
}

function reloadCharts(from_date, to_date){
	var to_date = to_date || false;
	var from_date = from_date || false;
	get().done(function(data){
		if (data.results.length > 0){
			_.each(data.results[0].$properties, function(data, name){
				if (name != "$last_seen" && name != "$predict_grade"){
					_.each(data, function(graphData){
						if (to_date){
							graphData.query.params.params.to_date = $("#toDate").val()
							graphData.query.params.params.from_date = $("#fromDate").val()
						}
						loadChart(graphData);
						if (queryParams.params.params.to_date) {
							$('#fromDateText').text(returnDateText(queryParams.params.params.from_date))
							$('#fromDate').val(queryParams.params.params.from_date)
							$('#toDateText').text(returnDateText(queryParams.params.params.to_date))
							$('#toDate').val(queryParams.params.params.to_date)
						} 					
					})
				}
			})
		} else {
			$('#fromDateText').text(returnDateText(moment().subtract(7, 'days')))
			$('#fromDate').val(moment().subtract(7, 'days').format('YYYY-MM-DD'))
			$('#toDateText').text(returnDateText(moment()))
			$('#toDate').val(moment().format('YYYY-MM-DD'))
		}
	})
}

function get() {
        return MP.api.query('/api/2.0/engage', {'distinct_id': "dashboardprofile"})
      }

function customEvent() {
	return MP.api.query('/api/2.0/custom_events', {})
}

function getFunnels() {
	var url = 'https://mixpanel.com/api/2.0/funnels/list/'
	return MP.api.query(url, {})
}