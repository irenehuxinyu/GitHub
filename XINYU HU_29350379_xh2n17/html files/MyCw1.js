var dispatch = d3.dispatch("load", "statechange");
		var groups = [
		  "Department of State",
		  "Department of Agriculture",
		  "Department of Defense",
		  "Department of the Interior",
		  "Office of Personnel Management",
		  "Department of Education",
		  "Department of Homeland Security",
		  "Department of Commerce",
		  "Department of Transportation",
		  "Department of Veterans Affairs",
		  "Sum of Other 15 Departments"
		];
		var statesALL;
		d3.csv("mydata.csv", type, function(error, states) {
			console.log(states)
			statesALL=states;
		  if (error) throw error;
		  var stateById = d3.map();
		  states.forEach(function(d) { stateById.set(d.AgencyName, d); });
		  console.log(stateById)

		  dispatch.call("load", this, stateById);
		  dispatch.call("statechange", this, stateById.get("Lifecycle Cost"));
		});


		var statesAll;
		dispatch.on("load.menu", function(stateById) {

		  var select = d3.select("body")
		    .append("div")
		    .append("select")
		      .on("change", function() { dispatch.call("statechange", this, stateById.get(this.value)); });

		  select.selectAll("option")
		      .data(stateById.values())
		    .enter().append("option")
		      .attr("value", function(d) { return d.AgencyName; })
		      .text(function(d) { return d.AgencyName; });

		  dispatch.on("statechange.menu", function(state) {
		  	statesAll=state.total

		    select.property("value", state.AgencyName);
		  });
		});


		dispatch.on("load.bar", function(stateById) {

		  var margin = {top: 20, right: 20, bottom: 30, left: 40},
		      width = 80 - margin.left - margin.right,
		      height = 460 - margin.top - margin.bottom;

		  var y = d3.scaleLinear()
		      .domain([0, d3.max(stateById.values(), function(d) { return d.total; })])
		      .rangeRound([height, 0])
		      .nice();

		  var yAxis = d3.axisLeft(y)
		      .tickFormat(d3.format(".2s"));

		  var svg = d3.select("body").append("svg")
		      .attr("width", width + margin.left + margin.right)
		      .attr("height", height + margin.top + margin.bottom)
		    .append("g")
		      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		  svg.append("g")
		      .attr("class", "y axis")
		      .call(yAxis);

		  var rect = svg.append("rect")
		      .attr("x", 4)
		      .attr("width", width - 4)
		      .attr("y", height)
		      .attr("height", 0)
		      .style("fill", "#aaa");

		  dispatch.on("statechange.bar", function(d) {
		    rect.transition()
		        .attr("y", y(d.total))
		        .attr("height", y(0) - y(d.total));
		  });
		});


		dispatch.on("load.pie", function(stateById) {
			console.log(stateById)
			  var width = 880,
			      height = 460,
			      radius = Math.min(width, height) / 2;

			  var color = d3.scaleOrdinal()
			      .domain(groups)
			      .range(["#ffb3d9", "#75a3a3", " #008000", " #ffc266", "#a05d56", "#4dc4ff",
			           "#407fbf","#ff6666"," #0066cc"," #b3003b","#9494b8"]);

			  var arc = d3.arc()
			      .outerRadius(radius - 10)
			      .innerRadius(radius - 70);
			  var tooltip = d3.select('#chart')
			      .append('div')
			      .attr('class', 'tooltip');

			    tooltip.append('div')
			      .attr('class', 'label');

			    tooltip.append('div')
			      .attr('class', 'count');

			    tooltip.append('div')
			      .attr('class', 'percent');


			  var pie = d3.pie()
			            .value(function(d) { return d.value; })
			            .sort(null);
			  var legendRectSize = 12;
			  var legendSpacing = 4;

			  var svg = d3.select("body").append("svg")
			      .attr("width", width)
			      .attr("height", height)
			    .append("g")
			      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

			  var path = svg.selectAll("path")
			      .data(groups)
			    .enter().append("path")
			      .style("fill", color)
			      .each(function() { this._current = {startAngle: 0, endAngle: 0}; });

			var tooltip = d3.select("body")
				.append("div")
				.attr("class","tooltip")
				.style("opacity",0.0);
			path.on("mouseover",function(d){
				var statesAllTotalFloor=Math.floor(statesAll)

			   var dValue=Math.floor(d.value)
               var percent=dValue*100/statesAllTotalFloor;
               tooltip.html(d.data +  "<br />"+dValue +"<br/>"+percent.toFixed(1)+"%" )
				            .style("left", (d3.event.pageX) + "px")
				            .style("top", (d3.event.pageY + 20) + "px")
				            .style("opacity",1.0);
				})
				.on("mousemove",function(d){


				    tooltip.style("left", (d3.event.pageX) + "px")
				            .style("top", (d3.event.pageY + 20) + "px");
				})
				.on("mouseout",function(d){


				    tooltip.style("opacity",0.0);
			})

			  dispatch.on("statechange.pie", function(d) {
			    path.data(pie.value(function(g) { return d[g]; })(groups)).transition()
			        .attrTween("d", function(d) {
			          var interpolate = d3.interpolate(this._current, d);
			          this._current = interpolate(0);
			          return function(t) {
			            return arc(interpolate(t));
			          };
			        });
			  });


			var legend = svg.selectAll('.legend')
			.data(color.domain())
			.enter()
			.append('g')
			.attr('class', 'legend')
			.attr('transform', function(d, i) {
				var height = legendRectSize + legendSpacing;
				var offset =  height * color.domain().length / 2;
				var horz = -7* legendRectSize;
				var vert = i * height - offset;
				return 'translate(' + horz + ',' + vert + ')';
			});

		   legend.append('rect')
			.attr('width', legendRectSize)
			.attr('height', legendRectSize)
			.style('fill', color)
			.style('stroke', color);

		   legend.append('text')
		.attr('x', legendRectSize + legendSpacing)
		.attr('y', legendRectSize - legendSpacing)
		.text(function(d) { return d; });
		});



		function type(d) {
		  d.total = d3.sum(groups, function(k) { return d[k] = +d[k]; });
		  return d;
		}
