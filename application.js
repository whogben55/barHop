
var start;
var end = null;
var directionsDisplay; 
var directionsService; 
var bars = new Array();
var best = new Array();
var map;
var numBars=8;
var searchBox;
var endBox;
var markers = [];
var mustGo = [];
var detail;
    var details = new Array();
                var service;
$(document).ready( function(){     
    directionsDisplay = new google.maps.DirectionsRenderer();
    directionsService = new google.maps.DirectionsService();
    function initialize()
    {   
        var mapProp = {
            center:new google.maps.LatLng(51.508742,-0.120850),
            zoom:5,
            mapTypeId:google.maps.MapTypeId.ROADMAP
        };
        map=new google.maps.Map(document.getElementById("googleMap"), mapProp);
        directionsDisplay.setMap(map);
        var input = /** @type {HTMLInputElement} */(document.getElementById('search'));
        searchBox = new google.maps.places.SearchBox(input);  
        var endInput = /** @type {HTMLInputElement} */(document.getElementById('end'));
        endBox = new google.maps.places.SearchBox(endInput); 
        search(searchBox, startChange, startClick);
        search(endBox, endChange, endClick);
        

        google.maps.event.addListener(map, 'bounds_changed', function() {
            var bounds = map.getBounds();
            searchBox.setBounds(bounds);
      });
        
    }    
    google.maps.event.addDomListener(window, 'load', initialize);
    $(document).on('click','.bars', function(){
        if($(this).find('.desc').css('display') == 'none'){
            $('.desc').hide(1000);
            var index = parseInt($(this).attr('id'));
            var request = {
                    reference: best[index-1].reference,
                    sensor: false        
            };
            service.getDetails(request,fun);
            var str;
            if (typeof detail.rating != 'undefined') {
                str = detail.rating + '/5 Stars </br>';
            } else str = '';
            $(this).find('.desc').html(str + detail.formatted_address);
            $(this).find('.desc').show('1000');
        } else $(this).find('.desc').hide('1000');
    });
    $(document).on('click','#x', function(){
        var index = parseInt($(this).parent().attr('id'));
        for (var i=0; i<bars.length; i++) {
            if (bars[i].geometry.location.lb == best[index-1].geometry.location.lb 
                && bars[i].geometry.location.mb == best[index-1].geometry.location.mb) {
                bars = remove(bars,i);
                $(this).parent().parent().empty();
                calcRoute(bars);
                break;
            }
        }
    });
    $(document).on('click','#add', function(){
        $('#barList').empty();
        calcRoute(bars);
    });
    $(document).on('click','#button', function(){
        if ($('#endarr').css('display') != 'none') {
            $('#endText').css('display','none');
            $('#endArr').css('display','none');
        } if(end == null){
            end = start;
        }
        $('#over').css('display','none');
        $('#end').remove();
        $('#search').val('');
        $('#button').html('Add Bar');
        $('#button').attr('id','add');
        $('#search').attr('id','addBar');
        $("#addBar").animate({margin: "+=20px",}, 1000 );
        var addInput = /** @type {HTMLInputElement} */(document.getElementById('addBar'));
        addBox = new google.maps.places.SearchBox(addInput); 
        search(addBox, addChange, addClick);
        var request = {
            location: start.geometry.location,
            rankBy: google.maps.places.RankBy.DISTANCE,
            types: ['bar']
        };
        var startArray= new Array();
        var endArray = new Array();
        infowindow = new google.maps.InfoWindow();
        service = new google.maps.places.PlacesService(map);
        var coming = new Array();
        var going = new Array();
        service.nearbySearch(request, function(results, status) {
            var request = {
                location: end.geometry.location,
                rankBy: google.maps.places.RankBy.DISTANCE,
                types: ['bar'],
            };
            service.nearbySearch(request, function(results2, status2) {
                var arr = [results,results2];
                var points = [start.geometry.location,end.geometry.location];
                bars = getBars(arr);
                if (bars.length < 8) {
                    bars = new Array();
                    for (var i=0; i<15; i++) {
                        bars.push(results[i]);
                        bars.push(results2[i]);
                    }
                }
                /** 
                * In a perfect world where google api would let me make as many requests as i wanted,
                * I would split the paths in half until i found a path with a constant stream of bars. 
                **/
                /**
                if( bars.length == 0 ){ // create points between these points
                    var newarr = new Array(); var newpoints = new Array();
                    newarr.push(arr[0]); newpoints.push(points[0]);
                    for( var i=0; i<arr.length-1; i++){
                        console.log(i);
                        var lb = (points[i].lb + points[i+1].lb)/2;
                        var mb = (points[i].mb + points[i+1].mb)/2;
                        var request2 = {
                            location: new google.maps.LatLng(lb,mb),
                            rankBy: google.maps.places.RankBy.DISTANCE,
                            types: ['bar'],
                        };
                        service.nearbySearch(request2, function(resultsN, status) {
                            console.log(2);
                            newarr.push(resultsN); newpoints.push(new google.maps.LatLng(lb,mb));
                            newarr.push(arr[i+1]); newpoints.push(points[i+1]);
                        });
                        $('#map').append(prettyPrint(newpoints));
                    }
                    $('body').append(prettyPrint(newpoints));
                    console.log(1);
                    points = newpoints;
                    arr = newarr;
                    bars = getBars(arr);
                    bars = results.concat(results2);
                }
                **/
                calcRoute(bars);
            });
            
        });
    });
});

function calcRoute(results) {
    geocoder = new google.maps.Geocoder();
    var waypts = [];
    best = findBest(results);
    for (var i = 0; i <best.length; i++) {
        waypts.push({
            location:best[i].geometry.location,
            stopover:true
        });
    };
    var request = {
        origin: start.geometry.location,
        destination: end.geometry.location,
        waypoints: waypts,
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode.WALKING
    };
    
    directionsService.route(request, function(response, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            directionsDisplay.setDirections(response);
        } else console.log(status);
    });
};
                          
   

                          
var findBest = function(places){
    console.log(places.length);
    var best = Number.MAX_VALUE;
    var bestTrip;
    var distances = new Array();
    for(var k=0; k<places.length; k++){
        dis = new Array();
        for(var j=0; j<places.length; j++){
            dis[j] = getDistance(places[k],places[j]);
        }
        distances[k]=dis;
    };
    distances['startDistance']= new Array();
    distances['endDistance'] = new Array();
    for(var i=0; i<places.length; i++){
        distances['startDistance'][i] = getDistance(start, places[i]);
        distances['endDistance'][i] = getDistance(end,places[i]);
    }
    console.log(places);
    for(var i=0; i<places.length; i++){
        var dx = places[i].geometry.location.lb - start.geometry.location.lb;
        var dy = places[i].geometry.location.mb - start.geometry.location.mb;
        var visited = new Array(places.length +1 ).join('0').split('').map(parseFloat);
        visited[i]=1;
        var distance = getDistance(start, places[i]);
        var route = getBest(2,places,visited,i,distance,distances,dx,dy);
        if( route['distance'] < best ){
            best = route['distance'];
            bestTrip = route['path'];
        }
    };

    var ret = new Array();
    for(var i=1;i<=numBars;i++){
        for(var j=0; j<bestTrip.length; j++){
            if( bestTrip[j] == i ){
                ret.push(places[j]);
                $('#barList').append('<div class="bars" id="' + i + '" style="display:none">' + bestTrip[j] + ': ' 
                                  + places[j].name + '<div id="x"></div><div class=desc></div></div>');
            }
        }
    }
    var request = {
            reference: ret[0].reference,
            sensor: false        
    }
    service.getDetails(request,fun);
    $('.bars').toggle(1000);
    return ret;
};
            

var getDistance = function(p1,p2){
    xdis = p1.geometry.location.lb - p2.geometry.location.lb;
    ydis = p1.geometry.location.mb - p2.geometry.location.mb;
    return Math.sqrt(Math.pow(xdis,2)+Math.pow(ydis,2));
};


var getBest = function(count, places, visited, current, distance,distances, dx, dy){
    if (count > numBars || count>places.length){
        var ret = new Array();
        distance += getDistance(places[current],start);
        for( var i=0; i<mustGo.length; i++){
            if( visited[mustGo[i]] == 0 ){
                distance = Number.MAX_VALUE;
            }
        }
        ret['distance'] = distance;
        ret['path'] = visited;
        return ret;
    }
    var best = Number.MAX_VALUE;
    var bestTrip;
    for(var i=0; i<places.length; i++){       
        if (visited[i] == 0) {
            var dxnew = places[i].geometry.location.lb - places[current].geometry.location.lb;
            var dynew = places[i].geometry.location.mb - places[current].geometry.location.mb;
            if( places.length > 8 ){
                if (pos(dxnew) != pos(dx) && pos(dynew) != pos(dy)) {
                    continue;
                }
                if ((start != end || count > 4) && distances['endDistance'][i] > distances['endDistance'][current]) {
                    continue;
                }
                if ((start == end && count <= 4) && distances['startDistance'][i] < distances['startDistance'][current]) {
                    continue;
                }      
            }
            var newVisited = new Array(places.length +1 ).join('0').split('').map(parseFloat);
            for( var j=0; j<visited.length; j++){
                newVisited[j] = visited[j];
            }
            newVisited[i]=count;
            var newDistance = distance + distances[current][i];
            var route = getBest(count+1,places,newVisited,i,newDistance,distances,dxnew,dynew);
        
            if( route['distance'] < best ){
                best = route['distance'];
                bestTrip = route['path'];
            }
        }
    }
    var ret = new Array();
    ret['distance'] = best;
    ret['path'] = bestTrip;
    return ret;
    
}

var search = function(box, cssFn, clickFn){        
    google.maps.event.addListener(box, 'places_changed', function() {
            var places = box.getPlaces();
            for (var i = 0, marker; marker = markers[i]; i++) {
                marker.setMap(null);
            }  
            var bounds = new google.maps.LatLngBounds();
            
            for (var i = 0, place; place = places[i]; i++) {
                var image = {
                    url: place.icon,
                    size: new google.maps.Size(71, 71),
                    origin: new google.maps.Point(0, 0),
                    anchor: new google.maps.Point(17, 34),
                    scaledSize: new google.maps.Size(25, 25)
                };
                var marker = new google.maps.Marker({
                    map: map,
                    icon: image,
                    title: place.name,
                    position: place.geometry.location,
                    place: place
                });
                google.maps.event.addListener(marker, 'click', function() {
                    clickFn(this.place);
                    map.panTo(this.getPosition());
                    map.setZoom(17);
                    for (var i = 0, marker; marker = markers[i]; i++) {
                        if (marker != this) {
                            marker.setMap(null);
                        }
                    }
                
                });
                markers.push(marker);
                bounds.extend(place.geometry.location);
            }
            cssFn(places);
            map.fitBounds(bounds);
        });

}


var pos = function(x){
    return x > 0 ? 1 : x == 0 ? 0 : -1;
}

var remove = function(arr,x){
    var ret = new Array();
    for( var i=0; i<arr.length; i++) {
        if (i != x) {
            ret.push(arr[i]);
        }
    }
    return ret;
}

var getBars = function(barsArray){
    var ret = new Array();
    if(barsArray.length < 2) return ret;
    for(var b=0; b<barsArray.length-1; b++){
        for(var i=0; i<barsArray[b].length; i++){
            for( var j=0; j<barsArray[b+1].length; j++){
                if (barsArray[b][i].geometry.location.lb == barsArray[b+1][j].geometry.location.lb
                  && barsArray[b][i].geometry.location.mb == barsArray[b+1][j].geometry.location.mb
                    && ret.indexOf(barsArray[b][i]) < 0) {
                    ret.push(barsArray[b][i]);
                    break;
                }
            }
        }
    }
    return ret;
}

var startChange = function(places){
    start = places[0];
    $('#first').css('display','none');
    $('#firstText').css('display','none');
    if(places.length>1) {
        $('#many').css('display','inline');
        $('#manyText').css('display','inline');
        return;
    }
    
    $('#endText').css('display','none');
    $('#endArr').css('display','none');
    $('#endText').css('display','inline');
    $('#endArr').css('display','inline');
}
var startClick = function(place){
    start=place;
    $('#many').css('display','none');
    $('#manyText').css('display','none');
    $('#endText').css('display','inline');
    $('#endArr').css('display','inline');
}
      
var endChange = function(places){
    end = places[0];
    $('#first').css('display','none');
    $('#firstText').css('display','none');
    if(places.length>1) {
        $('#many').css('display','inline');
        $('#manyText').css('display','inline');
        return;
    }
    $('#endText').css('display','none');
    $('#endArr').css('display','none');
    $('#over').css('display','inline');
}
var endClick = function(place){
    end = place;
    $('#over').css('display','inline');
}
var addChange = function(places){
    bars.push(places[0]);
    mustGo.push(bars.length-1);
}
var addClick = function(place){
    $('#many').css('display','none');
    if(mustGo.length == 0){
        bars.push(places[0]);
        mustGo.push(bars.length-1);
        return;
    }
    bars[bars.length-1] = place;
    mustGo[mustGo.length-1]=bars.length-1;
}
var fun = function(results, status){
    detail = results;
}