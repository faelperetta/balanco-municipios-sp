var SEPARADOR_URL = "&";
var balancoApp = angular.module('BalancoApp', []);

var colors = {};
var SEPARADOR_URL = "|";


// básico para começar, ainda não aprendi os módulos
balancoApp.controller('BalancoController',
    ['$scope', '$http', function($scope, $http) {        // set defaul colors        for(var i = 0; i < Highcharts.getOptions().colors.length; i++){            colors[2012 + i] = Highcharts.getOptions().colors[i];        }        // listeners
        $scope.showAbout = function() {            $('#modalSobre').modal();        };
        $scope.showHowItWorks = function() {            $('#modalFuncionamento').modal();        };
        $http.get("data/municipios.json").success(
            function(data) {
                $scope.municipios = data;
                var urlId = recuperaMapaUrl()['id'];
                if(urlId) {                    for(i in $scope.municipios) {                        var m = $scope.municipios[i];
                        if(m.id === urlId) {                            $scope.municipio = m;                        }                    }                    $scope.loadApp();                }
        });

        $scope.loadApp = function(){            var munId = $scope.municipio.id;
            var params = {};
            params['id'] = munId;
            salvaMapaUrl(params);
            $scope.revenue = null;
            $scope.expenses = null;
            $http.get("data/receitas/" + munId + ".json").success(
            function(data) {                $scope.revenue = data;                loadRevenue(data);
            });
            $http.get("data/despesas/" + munId + ".json").success(
            function(data) {                $scope.expenses = data;
                loadExpenses(data);
            });
            $('html, body').animate({
				scrollTop: $("#cmbMunicipios").offset().top - 70
			}, 1000);        };
}]);
// making global for debug
var detailsMap = {};
function loadExpenses(data) {    var series = [];
    var categories = [];
    var totals = {};
    var pieSerie = {        type: 'pie',
        name: 'Total',
        data: [],
        center: [30, 0],
        size: 50,
        showInLegend: false,
        dataLabels: {
            enabled: false
        }    };
    detailsMap = {};
    // extracting chart information from the data
    for(var i = 0; i < data.length; i++) {        var cat = data[i].funcao;
        var year = data[i].ano;        var serie = searchSeries(series, year);
        if(!serie) {            serie = { year: year, name: year, mapCategories: {}, data: [], color: colors[year]};            series.push(serie);        }
        if(categories.indexOf(cat) === -1) {            categories.push(cat); 
        }
        if(!serie.mapCategories[cat]) {            serie.mapCategories[cat] = 0;        }
        // sum all the values for this category
        serie.mapCategories[cat] += data[i].valor;
        // totals for the pie chart
        if(!totals[year]) totals[year] = 0;
        totals[year] += data[i].valor;
        // let's build the drilldown data now
        // the ID is the key
        var key = buildDetailsKey(cat, year);
        if(!detailsMap[key]) {
            detailsMap[key] = [];        }
        detailsMap[key].push({ "name" : data[i].subFuncao, "value" : data[i].valor });
    }
    // build the data for each category of each series(it might come in a random order, must organize)
    for(var i = 0; i < series.length; i++) {        for(var j = 0; j < categories.length; j++) {            var cat = categories[j];            var val = series[i].mapCategories[cat];
            series[i].data.push({                type: "column",                name: cat,                y: val
            });        }    }
    // add the data for the small pie chart
    for(var year in totals) {        pieSerie.data.push({
            name: year,
            y: totals[year],
            color: colors[year]                  });    }
    series.push(pieSerie);
    var chart = $('#expensesChart').highcharts({
        chart: {
            type: 'column'
        },
        title: { text: "Despesas por área" },
        xAxis: {
            categories: categories,
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Valor (R$)',
                align: 'high'
            },
		    labels: {
                overflow: 'justify',
			    formatter: function() {
				    return 'R$ ' + this.value.toLocaleString();
			    }				
		    }
        },
        tooltip: {
			pointFormat: 'Total R$ {point.y:,.3f}',
            formatter: function() {                console.log(this);
                if(!this.x) {                    return "<b> Total de despesas em " + this.key + "</b>: R$ " + this.y.toLocaleString();                } else {                    var area = this.x.split("-")[1];                    var output = "<b>Despesas com " + area + " em " + this.series.name + ": ";
                    output += "<span style=\"color: red\">R$: " + this.y.toLocaleString() + "</span>";                    var key = buildDetailsKey(this.x, this.series.name);
                    console.log(key);
                    var details = detailsMap[key]; 
                    if(details) { 
                        output += "<br /> <br /><em>Detalhes:</em><br/>";
                        for(var d in details) {                            var detail = details[d];                            output += "<b>" + detail.name + "</b>" + ": R$ " + detail.value.toLocaleString() + "<br />";                        }
                    }                                       
                    return output;                }            }
        },
        plotOptions: {
            bar: {
                dataLabels: {
                    enabled: true,
                    formatter: function () {                        return 'R$ ' + this.y.toLocaleString();                    }
                }
            }
        },
        series: series
    });
    chart.reflow();
}

    function loadRevenue(data) {        var series = [];
        var totals = {};
        var pieSerie = {            type: 'pie',
            name: 'Total',
            data: [],
            center: [30, 0],
            size: 50,
            showInLegend: false,
            dataLabels: {
                enabled: false
            }        };
        for(var i = 0; i< data.length; i++) {            var year = data[i].ano;            series[i] = { color: colors[year] };
            series[i].name = year;
            series[i].data = [                { type: "column", y: data[i].impostosProprios },
                { type: "column", y: data[i].impostosEstado },
                { type: "column", y: data[i].impostosUniao },
            ];
            if(!totals[year]) totals[year] = 0;
            totals[year] += data[i].impostosProprios + data[i].impostosEstado + data[i].impostosUniao;        }
        // add the data for the small pie chart
        for(var year in totals) {            pieSerie.data.push({
                name: year,
                y: totals[year],
                color: colors[year]                       });        }
        series.push(pieSerie);       var chart = $('#revenuesChart').highcharts({
        chart: {
            type: 'column'
        },
        title: { text: "Receita de impostos" },
        xAxis: {
            categories: ['Impostos Próprios', 'Impostos do Estado', 'Impostos da União'],

        },
        yAxis: {
            min: 0,
            title: {
                text: 'Valor (R$)',
                align: 'high'
            },
		    labels: {
                overflow: 'justify',
			    formatter: function() {
				    return 'R$ ' + this.value.toLocaleString();
			    }				
		    }
        },
        tooltip: {
            valuePrefix: ' R$ ',
            formatter: function() {                console.log(this);
                if(!this.x) { 
                    return "<b>Arrecadação com impostos em " + this.key + "</b>: R$ " + this.y.toLocaleString();
                } else {                    return "<b>" + this.x + " em " + this.series.name + "<br/></b> R$: " + this.y.toLocaleString();                }                           }
        },
        plotOptions: {
            bar: {
                dataLabels: {
                    enabled: true,
                    formatter: function () {                        return 'R$ ' + this.y.toLocaleString();                    }
                }
            }
        },
        series: series
    }); 
    chart.reflow();}
function buildDetailsKey(cat, year) {    return cat + " | Ano " + year;}
function searchSeries(series, year) {    var serie;    for(var i = 0; i< series.length; i++) {        if(series[i].year === year){            serie = series[i];        }    }
    return serie;}

function recuperaMapaUrl() {
	var todos = window.location.hash.replace('#', '');
	var params = {};
	$.each(todos.split(SEPARADOR_URL), function(i, v) {
		var campos = v.split('=');
		params[campos[0]] = campos[1];
	});
	return params;
}

function salvaMapaUrl(params) {
	var novaUrl = '';
	$.each(params, function(i, v) {
		novaUrl += i + '=' + v + SEPARADOR_URL;
	});
	window.location.hash = novaUrl.substring(0, novaUrl.length - 1);
}
