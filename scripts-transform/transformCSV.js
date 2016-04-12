/* * IMPORTS */
var csv = require("fast-csv"), normalizer = require('diacritics'), fs = require('fs');


/* * CONSTANTS */
var PATH_MUNICIPIOS = 'app/data/municipios.json'
var PATH_DESPESAS = 'app/data/despesas/'
var PATH_RECEITAS = 'app/data/receitas/'
var PATH_TODAS_RECEITAS = 'app/data/receitas.json'

/* * Globals */
var municipiosMapa = {};
var expenses = [], revenues = [];
var lastId = '';

/* * Util functions */
var writeJSON = function(path, content) {    fs.writeFile(path, JSON.stringify(content), 'utf8', function(err) {
        if(err) {
            return console.log(err);
        } else { 
            console.log("JSON escrito com sucesso em: " + path);
        }
    }); }


var toFloat = function(str) {    return parseFloat(str.split('.').join('').replace(',', '.'));}

var transformName = function(data) {    return normalizer.remove(data).toLowerCase().split(' ').join('_')}

var retrieveExpenses = function(data) {    // TODO: need to be adjusted according to the CSV, this is a workaround
    var years = ['2012', '2013', '2014']    
    for(i in years) {        var yearIndex = parseInt(i) + 7;        if(data[yearIndex] != '') {            var expense = { 
                funcao: data[5],
                subFuncao: data[6],
                ano: years[i],
                valor: toFloat(data[yearIndex])              };
            expenses.push(expense);        }    }
}
/* * need to write a JSON with cities human readable name and a normalized lower case name to: *  * APP_ROOT/data/municipios.json *  * This data is taken from the expenses JSON *  */
csv
 .fromPath("./data/despesa-funcao-subfunc.csv", {delimiter: ';' })
 .on("data", function(data){    var cityName = data[2];    if(cityName != 'Município') {        var id = transformName(cityName);
        municipiosMapa[id] = cityName;
        if(lastId == '') {            lastId = id;        }
        if(id == lastId) {            retrieveExpenses(data);        } else {            writeJSON(PATH_DESPESAS + lastId + '.json', expenses);
            expenses = [];
            lastId = id;        }
    } })
  .on("end", function(){    // save the last expense list
    writeJSON(PATH_DESPESAS + lastId + '.json', expenses);    var municipios = [];    for(m in municipiosMapa) {          municipios.push({              id: m,
              nome: municipiosMapa[m]          });    }
    writeJSON(PATH_MUNICIPIOS, municipios);
 });

/* * Will read the expenses data and write a JSON with the revenues of a given year to: *  * APP_ROOT/data/receitas.json * */
var pRevenueId = '';
csv
 .fromPath("./data/receitas_resultantes_de_impostos.csv", {delimiter: ';' })
 .on("data", function(data){    var cityName = data[0];    if(cityName != 'Município') {        var id = transformName(cityName);
        if(pRevenueId == '') pRevenueId = id;
        if(id != pRevenueId) {             writeJSON(PATH_RECEITAS + pRevenueId + '.json', revenues);
             revenues = [];
             pRevenueId = id;                 }
        revenues.push({            id: id,
            nome: cityName,
            ano: data[2],
            impostosProprios: toFloat(data[3]),
            impostosEstado: toFloat(data[4]),
            impostosUniao: toFloat(data[5]),
            total: toFloat(data[6])
        })
    } })
  .on("end", function(){
    writeJSON(PATH_RECEITAS + pRevenueId + '.json', revenues);
 });

